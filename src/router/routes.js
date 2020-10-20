
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('pages/Index.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'domains/:domain/forwards',
        name: 'forwards',
        component: () => import('pages/Forwards.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'blocked/ses',
        name: 'sessuppressed',
        component: () => import('pages/SesSuppressed.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'blocked/blacklisted',
        name: 'blacklisted',
        component: () => import('pages/Blacklisted.vue'),
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'dashboards/main',
        name: 'dashboard',
        component: () => import('pages/Dashboards/Main.vue'),
        meta: {
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/auth',
    component: () => import('layouts/Plain.vue'),
    children: [
      {
        path: '',
        name: 'auth',
        component: () => import('pages/Auth.vue'),
        meta: {
          requiresAuth: false
        }
      }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '*',
    component: () => import('pages/Error404.vue')
  }
]

export default routes
