import { createRouter, createWebHistory } from 'vue-router'
import Basic from '../views/Basic.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Basic,
    },
    {
      path: '/array',
      name: 'array',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/Array.vue'),
    },
  ],
})

export default router
