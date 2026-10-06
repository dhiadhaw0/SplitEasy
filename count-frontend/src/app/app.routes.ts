import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { nativeEntryGuard } from './core/guards/native-entry.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [nativeEntryGuard],
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'welcome',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/welcome/welcome.component').then(m => m.WelcomeComponent)
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
    // `data` keys are bound to matching component @Input()/input() names by withComponentInputBinding(),
    // same as route params — that's how a single LegalPageComponent serves both URLs.
    path: 'privacy',
    loadComponent: () => import('./features/legal/legal-page/legal-page.component').then(m => m.LegalPageComponent),
    data: { type: 'privacy' }
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/legal-page/legal-page.component').then(m => m.LegalPageComponent),
    data: { type: 'terms' }
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
            path: 'budget',
            loadComponent: () => import('./features/budget/budget-view/budget-view.component').then(m => m.BudgetViewComponent)
          },
          {
            path: 'activity',
            loadComponent: () => import('./features/activity/activity-view/activity-view.component').then(m => m.ActivityViewComponent)
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
