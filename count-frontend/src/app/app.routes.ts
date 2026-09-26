import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'join/:inviteCode',
    canActivate: [authGuard],
    loadComponent: () => import('./features/join/join-group/join-group.component').then(m => m.JoinGroupComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'groups',
        loadComponent: () => import('./features/groups/group-list/group-list.component').then(m => m.GroupListComponent)
      },
      {
        path: 'groups/:groupId',
        loadComponent: () => import('./features/groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent),
        children: [
          { path: '', redirectTo: 'expenses', pathMatch: 'full' },
          {
            path: 'expenses',
            loadComponent: () => import('./features/expenses/expense-list/expense-list.component').then(m => m.ExpenseListComponent)
          },
          {
            path: 'balances',
            loadComponent: () => import('./features/balances/balance-view/balance-view.component').then(m => m.BalanceViewComponent)
          },
          {
            path: 'stats',
            loadComponent: () => import('./features/stats/stats-view/stats-view.component').then(m => m.StatsViewComponent)
          },
          {
            path: 'participants',
            loadComponent: () =>
              import('./features/participants/participant-list/participant-list.component').then(m => m.ParticipantListComponent)
          },
          {
            path: 'settings',
            loadComponent: () => import('./features/groups/group-settings/group-settings.component').then(m => m.GroupSettingsComponent)
          }
        ]
      },
      {
        path: 'groups/:groupId/expenses/new',
        loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
      },
      {
        path: 'groups/:groupId/expenses/:expenseId',
        loadComponent: () => import('./features/expenses/expense-detail/expense-detail.component').then(m => m.ExpenseDetailComponent)
      },
      {
        path: 'groups/:groupId/expenses/:expenseId/edit',
        loadComponent: () => import('./features/expenses/expense-form/expense-form.component').then(m => m.ExpenseFormComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'groups' }
];
