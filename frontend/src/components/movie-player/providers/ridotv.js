export const fetchRidoTV = async (slug, ep, season) => {
  try {
    const getEpisodes = async (slug) => {
      const payload = {
        destination: `https://ridomovies.tv/tv/${slug}`,
      };
      try {
        const response = await fetch(`${window.location.origin}/proxy`, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const htmlContent = await response.text();
        // Regular expression to match the episodes JSON data
        const regex = /"episodes\\":\[(.*?)\]/g;
        let matches;
        const seasons = [];
        let seasonNumber = 1; // Counter for labeling seasons
        while ((matches = regex.exec(htmlContent)) !== null) {
          // matches[1] contains the captured group inside the parentheses
          const cleanJson = matches[1]
            .replace(/\\"/g, `"`)
            .replace(/\\\\"/g, "`");
          // Parse the cleaned JSON string
          const episodesData = JSON.parse(`[${cleanJson}]`);

          // Extract ID and episodeNumber of each episode and assign season number
          const episodes = episodesData.map((episode) => ({
            id: episode.id,
            episodeNumber: episode.episodeNumber,
            season: seasonNumber, // Add season number to each episode
          }));

          // Store episodes in the corresponding season
          seasons.push(episodes);

          seasonNumber++; // Increment season number
        }
        // Now seasons object contains episodes grouped by season
        // Call getIFrame with seasons object
        if (seasons[season - 1].length < ep) {
          return 404;
        } else {
          return getIFrame(seasons);
        }
      } catch (error) {
        console.log(error);
      }
    };
    const getIFrame = async (seasons) => {
      console.log("seasons: \n", seasons);
      let data;
      if (season && ep) {
        if (seasons.length > 0) {
          const episodeId = seasons[season - 1][ep - 1].id;
          const response = await fetch(
            `https://ridomovies.tv/core/api/episodes/${episodeId}/videos`,
            {
              headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9",
                "sec-ch-ua":
                  '"Microsoft Edge";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "cross-site",
              },
              referrerPolicy: "no-referrer",
              body: null,
              method: "GET",
            }
          );
          data = await response.json();
        }
      } else {
        const response = await fetch(
          `https%3A%2F%2Fridomovies.tv%2Fcore%2Fapi%2Fmovies%2F${slug}%2Fvideos`
        );
        data = await response.json();
      }
      if (!data.data[0]) {
        return 404;
      }
      const dataIFrameSrc = data.data[0].url.match(/data-src="([^"]+)"/);

      if (dataIFrameSrc) {
        const dataSrcValue = dataIFrameSrc[1];
        return getM3U8(dataSrcValue);
      } else {
        console.log("No data-src attribute found in the URL.");
      }
    };
    const getM3U8 = async (iFrameURL) => {
      const response = await fetch(
        `https://rv.lil-hacker.workers.dev/proxy?mirror=rido&url=${iFrameURL}`
      );
      const data = await response.text();
      const scriptTagRegex = /<script[^>]*>(.*?)<\/script>/gs;
      const scriptTags = data.match(scriptTagRegex);
      if (scriptTags) {
        for (const scriptTag of scriptTags) {
          if (scriptTag.includes("jwplayer")) {
            const regex = /file:\s*"(.*?)"/;
            const match = regex.exec(scriptTag);
            if (match) {
              const fileUrl = match[1];
              return fileUrl;
            }
          }
        }
      } else {
        console.error("No script tags found");
      }
    };
    const getIframeID = async () => {
      const response = await fetch(
        `https://rv.lil-hacker.workers.dev/proxy?mirror=rido&url=https://ridomovies.tv/movies/${slug}`
      );
      const doc = await response.text();
      const iframeID = /data-video[\s]*[\S]*=[\s]*"([\S]*)"/g.exec(doc);
      return await getStreamURL(iframeID[1]);
    };
    const getStreamURL = async (id) => {
      const response = await fetch(
        `https://rv.lil-hacker.workers.dev/proxy?mirror=rido&url=https://closeload.top/video/embed/${id}/`
      );
      const responseText = await response.text();
      const sourceURL = /eval\([\s\S]*\)/g.exec(responseText);
      const evalcode = sourceURL[0].replace(
        "return p",
        `const tempElement = document.createElement("noscript");
      tempElement.classList.add("data-slug");
      tempElement.textContent = p; // Assuming 'p' is defined somewhere in your code.
      document.body.appendChild(tempElement);
      return p;`
      );

      const evalFunction = new Function(evalcode);
      try {
        evalFunction();
      } catch (error) {}
      const ridoPage = document.querySelector(".data-slug");
      const srcVar =
        /myPlayer.src\({src:atob\(([\S]*)\),type:'application\/x-mpegURL'}\)/g.exec(
          ridoPage.textContent
        );

      const codedSRCRegex = new RegExp(srcVar[1] + `="([\\S]*)";`, "g");
      const codedSRC = codedSRCRegex.exec(ridoPage.textContent);
      return `https://rv.lil-hacker.workers.dev/?mirror=closeload&url=${atob(
        codedSRC[1]
      )}`;
    };
    if (slug && ep && season) {
      return await getEpisodes(slug);
    } else if (slug) {
      return await getIframeID();
    }
  } catch (error) {
    return error;
  }
};

export const getSlug = async (movieID, movieName) => {
  const formatedTitle = encodeURIComponent(movieName);

  try {
    const response = await fetch(
      `https://ridomovies.tv/core/api/search?q=${formatedTitle}`
    );
    const data = await response.json();
    let found = false;
    for (const item of data.data.items) {
      if (item.contentable.tmdbId === movieID) {
        found = true;
        return { status: 200, data: item.slug };
      }
    }
    if (!found) {
      return { status: 404 };
    }
  } catch (error) {
    console.error("Error fetching", error);
  }
};
