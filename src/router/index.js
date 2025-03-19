import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../Pages/HomePage.vue';
import BookmarksPage from '../Pages/BookmarksPage.vue';

const routes = [
  { path: '/', component: HomePage, name: 'home' },
  { path: '/bookmarks', component: BookmarksPage, name: 'bookmarks' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;