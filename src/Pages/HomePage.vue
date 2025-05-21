<template>
    <v-container class="home-page">
      <!-- Кнопка для открытия модального окна -->
      <v-btn class="auth-button" @click="handleAuthButtonClick">
        {{ isAuthenticated ? 'Выйти' : 'Авторизация' }}
      </v-btn>
  
      <!-- Поисковая строка -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card class="search-card">
            <v-text-field
              v-model="searchQuery"
              label="Что вы хотите посмотреть?"
              solo
              flat
              hide-details
              clearable
              prepend-inner-icon="mdi-card-search"
              @input="searchMovies"
            ></v-text-field>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Карточки фильмов -->
      <v-row class="movies-grid">
        <v-col
          v-for="movie in paginatedMovies"
          :key="movie.id"
          cols="12"
          sm="4"
          md="4"
          lg="4"
          class="movie-col"
        >
          <v-card class="movie-card" @click="openMovieDetails(movie)" @mouseenter="hoveredMovie = movie.id" @mouseleave="hoveredMovie = null">
            <v-img
              :src="movie.poster"
              height="300"
              cover
              class="movie-poster"
            >
              <div class="movie-overlay"></div>
              <v-card-title class="movie-title" :class="{ 'movie-title-up': hoveredMovie === movie.id }">
                {{ movie.title }}
              </v-card-title>
              <div class="movie-info" :class="{ 'movie-info-visible': hoveredMovie === movie.id }">
                <p><strong>Описание:</strong> {{ movie.description }}</p>
                <p><strong>Рейтинг:</strong> {{ movie.rating }}</p>
                <p><strong>Год:</strong> {{ movie.year }}</p>
                <v-btn color="grey" @click.stop="addToBookmarks(movie)">Добавить в закладки</v-btn>
              </div>
            </v-img>
          </v-card>
        </v-col>
      </v-row>
  
      <!-- Пагинация -->
      <v-row>
        <v-col cols="12">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:modelValue="handlePageChange"
            color="white"
          ></v-pagination>
        </v-col>
      </v-row>
  
      <!-- Модальное окно с деталями фильма -->
      <v-dialog v-model="isMovieDetailsOpen" max-width="800">
        <v-card v-if="selectedMovie" class="movie-details-modal">
          <v-img :src="selectedMovie.poster" cover class="modal-poster"></v-img>
          <v-card-text class="modal-content">
            <v-card-title class="modal-title">{{ selectedMovie.title }}</v-card-title>
            <p><strong>Рейтинг:</strong> {{ selectedMovie.rating }}</p>
            <p><strong>Год выпуска:</strong> {{ selectedMovie.year }}</p>
            <p><strong>Длительность:</strong> {{ selectedMovie.duration }} мин</p>
            <p><strong>Описание:</strong> {{ selectedMovie.description }}</p>
            <div class="trailer-container">
              <iframe
                width="100%"
                height="405"
                :src="selectedMovie.trailer"
                frameborder="0"
                allow="clipboard-write; autoplay"
                allowfullscreen
              ></iframe>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="isMovieDetailsOpen = false">Закрыть</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  
      <!-- Модальное окно для авторизации и регистрации -->
      <v-dialog v-model="isAuthModalOpen" max-width="500">
        <v-card>
          <v-tabs v-model="authTab">
            <v-tab value="login">Авторизация</v-tab>
            <v-tab value="register">Регистрация</v-tab>
          </v-tabs>
          <v-card-text>
            <!-- Форма авторизации -->
            <v-form v-if="authTab === 'login'" @submit.prevent="login">
              <v-text-field v-model="loginData.username" label="Логин" required></v-text-field>
              <v-text-field v-model="loginData.password" label="Пароль" type="password" required></v-text-field>
              <v-btn type="submit" color="primary">Войти</v-btn>
            </v-form>
  
            <!-- Форма регистрации -->
            <v-form v-if="authTab === 'register'" @submit.prevent="register">
              <v-text-field v-model="registerData.username" label="Логин" required></v-text-field>
              <v-text-field v-model="registerData.password" label="Пароль" type="password" required></v-text-field>
              <v-btn type="submit" color="primary">Зарегистрироваться</v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  
  export default {
    setup() {
      const searchQuery = ref('');
      const currentPage = ref(1);
      const moviesPerPage = 9;
      const hoveredMovie = ref(null);
      const isMovieDetailsOpen = ref(false);
      const selectedMovie = ref(null);
      const isAuthenticated = ref(false);
      const isAuthModalOpen = ref(false);
      const authTab = ref('login');
      const loginData = ref({ username: '', password: '' });
      const registerData = ref({ username: '', password: '' });
      const currentUser = ref(null);
  
      // Массив фильмов с обложками
      const movies = [
      {
          id: 1,
          title: "Один дома",
          poster: "https://st.kp.yandex.net/images/film_big/8124.jpg",
          year: 1990,
          rating: 8.1,
          duration: 103,
          description: "Комедия о мальчике, оставшемся дома один на Рождество.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 2,
          title: "1+1",
          poster: "https://st.kp.yandex.net/images/film_big/535341.jpg",
          year: 2014,
          rating: 8.6,
          duration: 169,
          description: "Фантастический эпос о путешествии через червоточину.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 3,
          title: "Джентльмены",
          poster: "https://st.kp.yandex.net/images/film_big/1143242.jpg",
          year: 2010,
          rating: 8.7,
          duration: 148,
          description: "Фильм о проникновении в сны.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 4,
          title: "Волк с Уолл-Стрит",
          poster: "https://st.kp.yandex.net/images/film_big/462682.jpg",
          year: 2019,
          rating: 8.4,
          duration: 122,
          description: "История становления Джокера.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 5,
          title: "Пираты Карибского моря",
          poster: "https://st.kp.yandex.net/images/film_big/4374.jpg",
          year: 2003,
          rating: 8.3,
          duration: 143,
          description: "Приключения капитана Джека Воробья.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 6,
          title: "Брат 2",
          poster: "https://st.kp.yandex.net/images/film_big/41520.jpg",
          year: 2000,
          rating: 8.6,
          duration: 155,
          description: "Эпическая история о римском генерале.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 7,
          title: "Достать Ножи",
          poster: "https://st.kp.yandex.net/images/film_big/1188529.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 8,
          title: "Гарри Поттер и философский камень",
          poster: "https://st.kp.yandex.net/images/film_big/689.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 9,
          title: "Интерстеллар",
          poster: "https://st.kp.yandex.net/images/film_big/258687.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 10,
          title: "Игра престолов",
          poster: "https://st.kp.yandex.net/images/film_big/464963.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 11,
          title: "Зеленая миля",
          poster: "https://st.kp.yandex.net/images/film_big/435.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 12,
          title: "Иван Васильвеич меняет профессию",
          poster: "https://st.kp.yandex.net/images/film_big/42664.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 13,
          title: "Зверополис",
          poster: "https://st.kp.yandex.net/images/film_big/775276.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 14,
          title: "Побег из шоушенка",
          poster: "https://st.kp.yandex.net/images/film_big/326.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 15,
          title: "Начало",
          poster: "https://st.kp.yandex.net/images/film_big/447301.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 16,
          title: "Аватар",
          poster: "https://st.kp.yandex.net/images/film_big/251733.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 17,
          title: "Брат",
          poster: "https://st.kp.yandex.net/images/film_big/41519.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        },
        {
          id: 18,
          title: "Гнев человеческий",
          poster: "https://st.kp.yandex.net/images/film_big/1318972.jpg",
          year: 2001,
          rating: 8.7,
          duration: 178,
          description: "Первая часть трилогии о Средиземье.",
          trailer: "https://rutube.ru/play/embed/d933451fcf84bf57c8b85d7d92ff591c/",
        }
      ];

  
      const filteredMovies = computed(() => {
        let filtered = movies;
        if (searchQuery.value) {
          filtered = filtered.filter(movie =>
            movie.title.toLowerCase().includes(searchQuery.value.toLowerCase())
          );
        }
        return filtered;
      });
  
      const totalPages = computed(() => Math.ceil(filteredMovies.value.length / moviesPerPage));
      const paginatedMovies = computed(() => {
        const start = (currentPage.value - 1) * moviesPerPage;
        const end = start + moviesPerPage;
        return filteredMovies.value.slice(start, end);
      });
  
      const handlePageChange = (page) => {
        currentPage.value = page;
      };
  
      const searchMovies = () => {
        currentPage.value = 1;
      };
  
      const openMovieDetails = (movie) => {
        selectedMovie.value = movie;
        isMovieDetailsOpen.value = true;
      };
  
      const addToBookmarks = async (movie) => {
        if (!isAuthenticated.value) {
          isAuthModalOpen.value = true;
          return;
        }
        try {
          const response = await fetch('http://localhost:3000/bookmarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: currentUser.value.id,
              movie_id: movie.id,
              title: movie.title,
              poster: movie.poster,
              year: movie.year,
              rating: movie.rating,
              duration: movie.duration,
            }),
          });
          if (response.ok) {
            console.log('Фильм добавлен в закладки');
          } else {
            console.error('Ошибка при добавлении фильма в закладки');
          }
        } catch (error) {
          console.error('Ошибка при запросе к серверу:', error);
        }
      };
  
      const login = async () => {
        try {
          const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData.value),
          });
          if (response.ok) {
            const data = await response.json();
            isAuthenticated.value = true;
            isAuthModalOpen.value = false;
            currentUser.value = data.user;
            localStorage.setItem('user', JSON.stringify(data.user)); // Сохраняем пользователя в localStorage
          } else {
            console.error('Ошибка при авторизации');
          }
        } catch (error) {
          console.error('Ошибка при запросе к серверу:', error);
        }
      };
  
      const register = async () => {
        try {
          const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData.value),
          });
          if (response.ok) {
            console.log('Пользователь зарегистрирован');
            authTab.value = 'login'; // Переключаем на вкладку авторизации
          } else {
            console.error('Ошибка при регистрации');
          }
        } catch (error) {
          console.error('Ошибка при запросе к серверу:', error);
        }
      };
  
      const logout = () => {
        isAuthenticated.value = false;
        currentUser.value = null;
        localStorage.removeItem('user'); // Удаляем пользователя из localStorage
      };
  
      const handleAuthButtonClick = () => {
        if (isAuthenticated.value) {
          logout();
        } else {
          isAuthModalOpen.value = true;
        }
      };
  
      // При монтировании компонента проверяем, есть ли пользователь в localStorage
      onMounted(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          isAuthenticated.value = true;
          currentUser.value = user;
        }
      });
  
      return {
        searchQuery,
        currentPage,
        moviesPerPage,
        hoveredMovie,
        isMovieDetailsOpen,
        selectedMovie,
        isAuthenticated,
        isAuthModalOpen,
        authTab,
        loginData,
        registerData,
        filteredMovies,
        paginatedMovies,
        totalPages,
        handlePageChange,
        searchMovies,
        openMovieDetails,
        addToBookmarks,
        login,
        register,
        logout,
        handleAuthButtonClick,
      };
    },
  };
  </script>

  <style scoped>
  .home-page {
    background-color: #000;
    min-height: 100vh;
    padding: 0;
    max-width: 100vw;
  }
  
  .auth-button {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
  }
  
  .search-card {
    background-color: #333;
    border-radius:5px;
    padding: 5px;
    margin-top: 5px;
  }
  
  .movies-grid {
    margin: 0;
    padding: 0;
  }
  
  .movie-col {
    padding: 10px;
  }
  
  .movie-card {
    background-color: #000;
    border-radius: 15px;
    overflow: hidden;
    margin: 0;
    padding: 0;
    position: relative;
    cursor: pointer;
  }
  
  .movie-poster {
    position: relative;
    border-radius: 15px;
  }
  
  .movie-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
    border-radius: 15px;
  }
  
  .movie-title {
    position: absolute;
    bottom: 10px;
    left: 10px;
    color: white;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 2;
    transition: bottom 0.3s ease;
  }
  
  .movie-title-up {
    bottom: 120px;
  }
  
  .movie-info {
    position: absolute;
    bottom: -100%;
    left: 0;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    transition: bottom 0.3s ease;
    border-radius: 0 0 15px 15px;
  }
  
  .movie-info-visible {
    bottom: 0;
  }
  
  .v-pagination {
    justify-content: center;
    margin-top: 20px;
  }
  
  .movie-details-modal {
    background-color: #000;
    color: white;
  }
  
  .modal-poster {
    width: 100%;
    height: auto;
    border-radius: 15px 15px 0 0;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .modal-title {
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .trailer-container {
    margin-top: 20px;
  }
  </style>