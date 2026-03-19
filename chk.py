from tenacity import retry, wait_fixed, stop_after_attempt
import pickle as p
import streamlit as st
import requests as r

st.header("Movie Recommender System")

# Function to fetch movie poster from TMDb
@retry(wait=wait_fixed(2), stop=stop_after_attempt(3))
def fetch_poster(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key=71b4aad1ba4567b150fcc24992459c45"
    try:
        response = r.get(url)
        response.raise_for_status()  # Raises HTTP errors
        data = response.json()
        return f"http://image.tmdb.org/t/p/w500/{data['poster_path']}" if 'poster_path' in data else None
    except r.exceptions.RequestException as e:
        st.error(f"Error fetching poster: {e}")
        return None

# Recommendation function (returns only ONE recommended movie)
def recommend(movie):
    index = movies[movies['title'] == movie].index[0]
    distances = sorted(list(enumerate(similarity[index])), reverse=True, key=lambda x: x[1])

    # Get the most similar movie (skip the first one, as it's the selected movie itself)
    if len(distances) > 1:
        recommended_movie_index = distances[1][0]  # Pick the top recommended movie
        movie_id = movies.iloc[recommended_movie_index]['id']
        poster = fetch_poster(movie_id)
        return movies.iloc[recommended_movie_index]['title'], poster
    else:
        return None, None

# Load pickled data
with open('artificats/movie_list.pkl', 'rb') as file:
    movies = p.load(file)
with open('artificats/similarity.pkl', 'rb') as file:
    similarity = p.load(file)

movies_list = movies['title'].values
selected_movie = st.selectbox('Type or select a movie to get a recommendation', movies_list)

# Show recommendation when button is clicked
if st.button('Show Recommendation'):
    recommended_movie, recommended_poster = recommend(selected_movie)

    if recommended_movie:
        st.subheader("You might also like:")
        st.text(recommended_movie)
        if recommended_poster:
            st.image(recommended_poster[0])
        else:
            st.warning("Poster not available.")
    else:
        st.warning("No recommendations found.")
