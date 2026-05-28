# Gladex Branding — Design Tokens

## Color Palette

### Light Theme (Default)
```css
--background: 210 40% 98%;           /* Soft light blue */
--foreground: 222 47% 11%;           /* Dark navy */
--card: 0 0% 100%;                   /* Pure white */
--card-foreground: 222 47% 11%;      /* Dark navy */
--primary: 25 95% 53%;               /* Warm orange */
--primary-foreground: 0 0% 100%;     /* White */
--secondary: 213 94% 25%;            /* Deep blue */
--secondary-foreground: 0 0% 100%;   /* White */
--accent: 25 95% 53%;                /* Warm orange (matches primary) */
--accent-foreground: 0 0% 100%;      /* White */
--destructive: 0 84% 60%;            /* Red */
--destructive-foreground: 0 0% 98%;  /* Off-white */
--border: 214 32% 91%;               /* Light gray */
--input: 214 32% 91%;                /* Light gray */
--muted: 210 40% 96%;                /* Very light gray */
--muted-foreground: 215 16% 47%;     /* Medium gray */
--ring: 25 95% 53%;                  /* Orange focus ring */
```

### Dark Theme
```css
--background: 0 0% 3.9%;             /* Almost black */
--foreground: 0 0% 98%;              /* Almost white */
--primary: 0 0% 98%;                 /* White */
--primary-foreground: 0 0% 9%;       /* Dark */
--secondary: 0 0% 14.9%;             /* Dark gray */
--secondary-foreground: 0 0% 98%;    /* White */
```

### Sidebar Colors
```css
--sidebar-background: 213 94% 18%;   /* Deep blue */
--sidebar-foreground: 210 40% 98%;   /* Light blue-white */
--sidebar-primary: 25 95% 53%;       /* Orange */
--sidebar-primary-foreground: 0 0% 100%; /* White */
--sidebar-accent: 213 94% 25%;       /* Lighter deep blue */
--sidebar-accent-foreground: 210 40% 98%; /* Light */
--sidebar-border: 213 94% 30%;       /* Blue */
--sidebar-ring: 25 95% 53%;          /* Orange */
```

## Brand Colors (HSL Format)

| Name | HSL | Use Case |
|------|-----|----------|
| **Primary Orange** | `25 95% 53%` | Buttons, CTAs, highlights |
| **Secondary Blue** | `213 94% 25%` | Sidebar, secondary actions |
| **Deep Blue** | `213 94% 18%` | Sidebar background |
| **Foreground Navy** | `222 47% 11%` | Text, headings |
| **Light Background** | `210 40% 98%` | Page background |
| **Border Gray** | `214 32% 91%` | Borders, dividers |

## Tailwind Configuration

```javascript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))'
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))'
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))'
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))'
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
  sidebar: {
    DEFAULT: 'hsl(var(--sidebar-background))',
    foreground: 'hsl(var(--sidebar-foreground))',
    primary: 'hsl(var(--sidebar-primary))',
    accent: 'hsl(var(--sidebar-accent))',
    border: 'hsl(var(--sidebar-border))',
    ring: 'hsl(var(--sidebar-ring))'
  }
}
```

## Design Tokens for CSS Variables

Copy this into your `index.css` `:root` section:

```css
:root {
  --background: 210 40% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 25 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 213 94% 25%;
  --secondary-foreground: 0 0% 100%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 25 95% 53%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 98%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 25 95% 53%;
  --radius: 0.75rem;
  --sidebar-background: 213 94% 18%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 25 95% 53%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 213 94% 25%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border: 213 94% 30%;
  --sidebar-ring: 25 95% 53%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 3.9%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

## Typography

- **Font Stack**: System fonts (Tailwind default)
- **Base Radius**: `0.75rem`
- **Focus Ring**: Orange (`25 95% 53%`)

## Key Design Characteristics

- **Warm, Professional**: Orange primary with deep blue secondary
- **High Contrast**: Dark navy text on light backgrounds
- **Accessible**: Meets WCAG AA standards
- **Modern**: Clean, spacious layout with rounded corners (`0.75rem`)
- **Dark Mode Support**: Full dark theme included

## Implementation

1. Copy the `:root` CSS variables into your `index.css`
2. Update your `tailwind.config.js` with the color mappings
3. Use class names like `bg-primary`, `text-foreground`, `border-border`, etc.
4. The sidebar colors are automatically applied to sidebar components

All colors use HSL format for easy manipulation (lighter/darker variants can be adjusted by changing the lightness value).