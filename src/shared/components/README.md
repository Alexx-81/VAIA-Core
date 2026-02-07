# Модерни UI Компоненти

## ConfirmDialog

Модерен потвърдителен диалог с гладки анимации, glassmorphism ефекти и динамични цветни акценти.

### Характеристики

- 🎨 **Glassmorphism Design** - Полупрозрачен фон с backdrop blur
- 🌈 **Динамични цветове** - 4 варианта (danger, warning, success, info) с уникални градиенти
- ✨ **Smooth Animations** - Cubic-bezier easing за естествено усещане
- 🔔 **Pulsing Glow Effects** - Анимирани светлинни ефекти около иконите
- ⌨️ **Keyboard Support** - ESC затваря диалога
- 📱 **Responsive** - Адаптивен дизайн за мобилни устройства

### Употреба

```tsx
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

const [confirmDialog, setConfirmDialog] = useState({
  isOpen: false,
  title: '',
  message: '',
  variant: 'warning',
  onConfirm: () => {},
});

// В JSX
<ConfirmDialog
  isOpen={confirmDialog.isOpen}
  title="Потвърждение"
  message="Сигурни ли сте?"
  variant="warning" // 'danger' | 'warning' | 'success' | 'info'
  confirmText="Потвърди" // optional
  cancelText="Откажи" // optional
  onConfirm={() => {
    // вашата логика
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  }}
  onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
/>
```

### Варианти

- **danger** - Червен, за критични/опасни действия (изтриване, деактивиране)
- **warning** - Оранжев, за предупреждения и важни решения
- **success** - Зелен, за положителни потвърждения
- **info** - Син, за информационни съобщения

---

## Toast

Модерно нотификационно съобщение с автоматично изчезване и визуален progress bar.

### Характеристики

- 🎯 **Auto-dismiss** - Автоматично изчезва след зададено време
- 📊 **Progress Bar** - Визуална индикация за оставащо време
- ⏸️ **Hover Pause** - Пауза на таймера при hover
- 🎨 **4 варианта** - success, error, warning, info с уникални цветове
- 🖱️ **Click to dismiss** - Затваря се при клик навсякъде по него
- 📍 **Fixed Position** - Винаги видимо в горния десен ъгъл

### Употреба

```tsx
import { Toast } from '../../../shared/components/Toast';

const [toast, setToast] = useState({
  isOpen: false,
  message: '',
  variant: 'info',
});

// Показване на toast
setToast({
  isOpen: true,
  message: 'Операцията беше успешна!',
  variant: 'success',
});

// В JSX
<Toast
  isOpen={toast.isOpen}
  message={toast.message}
  variant={toast.variant} // 'success' | 'error' | 'warning' | 'info'
  duration={3000} // optional, default 3000ms
  onClose={() => setToast({ ...toast, isOpen: false })}
/>
```

### Варианти

- **success** - Зелен, за успешни операции (✓)
- **error** - Червен, за грешки (✕)
- **warning** - Оранжев, за предупреждения (⚠)
- **info** - Син, за информационни съобщения (ℹ)

---

## Дизайнерски елементи

### Color Palette
- **Success**: `#34c759` → `#28a745`
- **Error/Danger**: `#ff4444` → `#cc0000`
- **Warning**: `#ff9500` → `#cc7700`
- **Info**: `#0b4f8a` → `#084070`

### Effects
- **Glassmorphism**: `backdrop-filter: blur(8-12px)`
- **Shadows**: Multi-layered box-shadows за дълбочина
- **Gradients**: Linear gradients 135deg за модерен вид
- **Animations**: Cubic-bezier(0.34, 1.56, 0.64, 1) за bounce effect

### Typography
- **Titles**: Font-weight 700, gradient text fill
- **Messages**: Font-weight 500, rgba(255,255,255, 0.75-0.9)

---

## Технологии

- **React 19** - Functional components with hooks
- **TypeScript** - Type-safe props и state
- **CSS3** - Modern CSS with animations, transforms, filters
- **Accessibility** - ARIA labels, keyboard navigation, semantic HTML
