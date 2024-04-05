import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";
import Playerjs from "../Player"; // Import Playerjs library
import DisableDevtool from "disable-devtool";
import "../styles/MovieDescription.css";
import PlayIcon from "../assets/play.svg";
import Navbar from "./Navbar";
import Carousel from "./Carousel";

const MovieDescription = () => {
  const navigate = useNavigate();
  const { mediaType, movieID, season } = useParams();
  const [movieInfos, setMovieInfos] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [isOverviewAllShowed, setIsOverviewAllShowed] = useState(false);
  const [wordsInOverview, setWordsInOverview] = useState(13);
  const [currentSection, setCurrentSection] = useState("");
  const [seasonDetails, setSeasonDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState();
  const [activeServer, setActiveServer] = useState(null);
  const [streamVideo, setStreamVideo] = useState("");
  const [subtitles, setSubtitles] = useState("");
  useEffect(() => {
    DisableDevtool({
      ondevtoolopen: () => {
        window.location.href = "/sonic.html";
      },
    });
  }, []);
  const getMovieInfos = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/${mediaType}/${movieID}?api_key=d0e6107be30f2a3cb0a34ad2a90ceb6f&language=en-US&append_to_response=videos,credits,images,external_ids,release_dates&include_image_language=en`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch movie info");
      }
      const movieInfosResponse = await response.json();
      setMovieInfos(movieInfosResponse);
      console.log(movieInfosResponse);
      if (mediaType === "tv") {
        const numberOfSeasons = movieInfosResponse.number_of_seasons;
        if (numberOfSeasons > 0) {
          const seasonsArray = [];
          for (let i = 1; i <= numberOfSeasons; i++) {
            seasonsArray.push(i);
          }
          setSeasons(seasonsArray);
        }
      }
    } catch (error) {
      console.error("Error fetching movie info:", error.message);
      // Handle error gracefully, e.g., show a message to the user
    }
  };
  const handleSeasonChange = (season) => {
    setSelectedSeason(season);
  };
  useEffect(() => {
    if (window.innerWidth >= 800) {
      setWordsInOverview(50);
    }
    getMovieInfos();
    if (mediaType == "tv") {
      if (season) {
        setSelectedSeason(season);
      } else {
        setSelectedSeason("1");
      }
    }
  }, []);

  const handleSectionClick = (name) => {
    if (name !== currentSection) {
      setCurrentSection(name);
    }
  };
  const fetchSeasonDetails = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${movieID}/season/${selectedSeason}?api_key=d0e6107be30f2a3cb0a34ad2a90ceb6f&language=en-US`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch season details");
      }
      const seasonDetailsResponse = await response.json();
      setSeasonDetails(seasonDetailsResponse);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching season details:", error.message);
      // Handle error gracefully, e.g., show a message to the user
    }
  };
  useEffect(() => {
    if (selectedSeason) {
      setLoading(true);
      navigate(`/${mediaType}/${movieID}/${selectedSeason}`);
      fetchSeasonDetails();
    }
  }, [selectedSeason]);
  const handleEpisodeClick = (episodeDetails, movieName) => {
    setLoading(true);
    const newUrl = `/${mediaType}/${movieID}/${selectedSeason}/${episodeDetails.episode_number}`;
    navigate(newUrl, {
      state: { episodeDetails, movieName },
    });
  };
  const handleWatchClick = () => {
    setLoading(true);
    fetchStreamURL();
  };
  const fetchStreamURL = async (episodeNumber) => {
    try {
      const response = await fetch(
        `https://embed.smashystream.com/data.php?tmdb=${movieID}${
          selectedSeason && `&s=${selectedSeason}&e=${episodeNumber}`
        }`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch stream URL");
      }
      const data = await response.json();
      const streamURLArray = data.url_array; // Assuming the response directly provides the stream URL
      setSources(streamURLArray);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching stream URL:", error.message);
    }
    setLoading(false);
  };
  const handleServerSwitch = async (serverURl) => {
    setActiveServer(serverURl);
    setLoading(true);
    const response = await fetch(serverURl);
    const data = await response.json();
    setStreamVideo(data.sourceUrls[0]);
    setSubtitles(data.subtitles);
    setLoading(false);
  };

  useEffect(() => {
    if (streamVideo && subtitles) {
      console.log(streamVideo)
      var player = new Playerjs({
        id: "player",
        file: `${streamVideo}`,
        subtitle: subtitles,
      });
    }
    // Function to handle player events
    function handlePlayerEvents(event, id, data) {
      // Handle different events
      switch (event) {
        case "play":
          console.log("Playback started");
          break;
        case "pause":
          console.log("Playback paused");
          // You can perform actions when playback is paused
          break;
        case "error":
          console.error("Playback error:", data);

          // Handle playback errors
          break;

        // Add more cases for other events as needed
        default:
          // Handle other events
          break;
      }
    }

    // Listen for player events
    window.PlayerjsEvents = handlePlayerEvents;
  }, [streamVideo, subtitles]);

  return (
    <div className="movie-description-page">
      <Navbar />
      {loading && (
        <div className="loading-animation">
          <ScaleLoader
            color="blue"
            size={150}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      )}
      <div
        className="blured-backdrop"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original/${movieInfos.backdrop_path})`,
        }}
      ></div>
      <div className="movie-description-container">
        <div className="backdrop">
          <img
            src={`https://image.tmdb.org/t/p/original/${movieInfos.backdrop_path}`}
            alt="Backdrop"
          />
          <div className="movie-infos">
            <div className="movie-ids">
              <h3>{movieInfos.original_title || movieInfos.original_name}</h3>
              <p>{movieInfos.first_air_date || movieInfos.release_date}</p>
            </div>
          </div>
          {mediaType == "movie" && (
            <div className="watch-button" onClick={() => handleWatchClick()}>
              <img src={PlayIcon} />
              <p>Watch</p>
            </div>
          )}
        </div>
        {movieInfos && (
          <>
            <div className="sections-container">
              <div className="sections">
                <div
                  onClick={() => handleSectionClick("overview")}
                  className={
                    currentSection === "overview" ? "section active" : "section"
                  }
                >
                  <h4>Overview</h4>
                </div>
                <div
                  onClick={() => handleSectionClick("clips")}
                  className={
                    currentSection === "clips" ? "section active" : "section"
                  }
                >
                  <h4>Clips</h4>
                </div>
              </div>
              {currentSection === "overview" && (
                <div className="overview">
                  <p>
                    {!isOverviewAllShowed
                      ? movieInfos.overview
                          .split(" ")
                          .slice(0, wordsInOverview)
                          .join(" ") + "...."
                      : movieInfos.overview}
                    {!isOverviewAllShowed ? (
                      <span
                        className="show-more-toggle"
                        onClick={setIsOverviewAllShowed}
                      >
                        Show more
                      </span>
                    ) : null}
                  </p>
                </div>
              )}
              {currentSection === "clips" && (
                <div className="clips">
                  {movieInfos.videos.results.map((clip) => (
                    <div className="clip" key={clip.id}>
                      <a
                        href={`https://www.youtube.com/watch?v=${clip.key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${clip.key}/mqdefault.jpg`}
                          alt={clip.name}
                        />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        <div id="player"></div>
        {sources && (
          <div className="sources-list">
            <h3>Servers List</h3>
            <div className="sources-container">
              {sources.map((source, index) => {
                const isActive = source.url == activeServer;
                return (
                  <div
                    className={isActive ? "active" : ""}
                    key={source.name}
                    onClick={() => handleServerSwitch(source.url)}
                  >
                    {source.name.replace(/Player/g, `${index + 1} -`)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {mediaType === "tv" && (
          <div className="select-season">
            <select
              value={selectedSeason}
              onChange={(e) => handleSeasonChange(e.target.value)}
            >
              <option value="">Select Season</option>
              {seasons.map((season) => (
                <option key={season} value={season}>
                  Season {season}
                </option>
              ))}
            </select>
          </div>
        )}
        {seasonDetails && (
          <div className="season-details">
            {/* <p>{seasonDetails.overview}</p> */}
            <div className="episodes-list">
              {seasonDetails.episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="episode"
                  onClick={() => {
                    handleEpisodeClick(
                      episode,
                      movieInfos.title || movieInfos.name
                    );
                  }}
                >
                  {/* Episode image */}
                  <img
                    src={`https://image.tmdb.org/t/p/w400/${episode.still_path}`}
                    alt={`Episode ${episode.episode_number} Still`}
                    className="episode-image"
                  />

                  {/* Episode details */}
                  <div className="episode-details">
                    <h3>
                      E{episode.episode_number} - {episode.name}
                    </h3>
                    <p className="airdate">{episode.air_date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {movieInfos && movieInfos.credits && (
        <div className="cast">
          <Carousel
            movies={movieInfos.credits.cast}
            type={"Cast"}
            media_type={"Cast"}
            category={"Credits"}
          />
        </div>
      )}
    </div>
  );
};

export default MovieDescription;
