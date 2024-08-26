import "../styles/MovieInfos.css";
import { useParams } from "@solidjs/router";
import { createSignal } from "solid-js";
import { getFullAPIUrl } from "../Utils/tmdb";

const MovieInfos = () => {
  const { mediaType, id } = useParams();

  const [movieDetails, setMovieDetails] = createSignal({});

  const fetchMovieDetails = async () => {
    const res = await fetch(
      getFullAPIUrl(`https://api.themoviedb.org/3/${mediaType}/${id}`)
    );
    setMovieDetails(await res.json());
  };

  fetchMovieDetails();
  return (
    <div class="movieInfos flex">
      <h3 className="title">{movieDetails().title || movieDetails().name}</h3>
    </div>
  );
};

export default MovieInfos;