let accessToken;
const clientID = "e3af4d037f7a48bab455dbcae29c2d86";
const redirectUrl = "http://localhost:3000";

const Spotify = {
  getAccessToken() {
    // First check for access token
    if (accessToken) return accessToken;

    const tokenInUrl = window.location.href.match(/access_token=([^&]*)/);
    const expiryTime = window.location.href.match(/expires_in=([^&]*)/);

    // Second check for access token
    if (tokenInUrl && expiryTime) {
      accessToken = tokenInUrl[1];
      const expiresIn = Number(expiryTime[1]);

      // Setting the access token calue to expire at the value for expiration time
      window.setTimeout(() => (accessToken = ""), expiresIn * 1000);
      // clearing the URL after the access token expires
      window.history.pushState("Access token", null, "/");

      return accessToken;
    }

    // Third check for access token, if previous two checks are false
    const redirect = `https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=token&scope=playlist-modify-public&redirect_uri=${redirectUrl}`;

    window.location = redirect;
  },

  search(term) {
    accessToken = Spotify.getAccessToken();
    return fetch(`https://api.spotify.com/v1/search?type=track&q=${term}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((response) => response.json())
      .then((jsonResponse) => {
        if (!jsonResponse) {
          console.error("Response error");
        }

        // console.log("accessToken", accessToken);

        // console.log("jsonResponse", jsonResponse);

        return jsonResponse.tracks.items.map((t) => ({
          id: t.id,
          name: t.name,
          artist: t.artists[0].name,
          album: t.album.name,
          uri: t.uri,
        }));
      });
  },

  savePlaylist(name, trackUris) {
    if (!name || !trackUris) return;

    const aToken = this.getAccessToken();
    const header = { Authorization: `Bearer ${aToken}` };
    let userID;

    return fetch(`https://api.spotify.com/v1/me`, { headers: header })
      .then((response) => response.json())
      .then((jsonResponse) => {
        userID = jsonResponse.id;
        let playlistID;
        return fetch(`https://api.spotify.com/v1/users/${userID}/playlists`, {
          headers: header,
          method: "post",
          body: JSON.stringify({ name: name }),
        })
          .then((response) => response.json())
          .then((jsonResponse) => {
            playlistID = jsonResponse.id;
            return fetch(
              `https://api.spotify.com/v1/playlists/${playlistID}/tracks`,
              {
                headers: header,
                method: "post",
                body: JSON.stringify({ uris: trackUris }),
              }
            );
          });
      });
  },
};

export { Spotify };
