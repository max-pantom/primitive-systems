# Primitive Systems check book

Run `pnpm rules` to execute every check. The same checks run in `pnpm test`, so a violation fails the build.

| Check | What it verifies |
| --- | --- |
| `tokens-only` | Named tokens only |
| `grid` | 4 / 8 grid |
| `control-padding` | Controls: 12px left and right |
| `surface-padding` | Cards and panels: 16 / 12 |
| `gap` | Default gap 12 |
| `menu-item` | Menu items: 6 / 4 |
| `tabs-spacing` | Tabs: 12 spacing |
| `type-scale` | Two type sizes |
| `hairline` | One stroke |
| `focus` | Dim focus |
| `disabled` | Disabled |
| `icons` | Primitive8 icons only |
| `a11y` | Accessible by default |
| `guidelines` | Every component ships do/don't guidelines |
| `no-brand` | No hardcoded brand |

Checks run on every component's style rules (all states) and on its rendered markup in two variants (defaults and an everything-toggled variant).

## Result: all components pass

| Component | id | Style rules | Markup / a11y | Guidelines |
| --- | --- | --- | --- | --- |
| Button | `button` | pass | pass | yes |
| Card | `card` | pass | pass | yes |
| Text Input | `text-input` | pass | pass | yes |
| Textarea | `textarea` | pass | pass | yes |
| Divider | `divider` | pass | pass | yes |
| Menu | `menu` | pass | pass | yes |
| Tabs | `tabs` | pass | pass | yes |
| Disclosure | `disclosure` | pass | pass | yes |
| Data List | `data-list` | pass | pass | yes |
| Select | `select` | pass | pass | yes |
| Checkbox | `checkbox` | pass | pass | yes |
| Switch | `switch` | pass | pass | yes |
| Badge | `badge` | pass | pass | yes |
| Tooltip | `tooltip` | pass | pass | yes |
| Dialog | `dialog` | pass | pass | yes |
| Toast | `toast` | pass | pass | yes |
| Avatar | `avatar` | pass | pass | yes |
| Radio Group | `radio-group` | pass | pass | yes |
| Field | `field` | pass | pass | yes |
| Search Input | `search-input` | pass | pass | yes |
| Segmented Control | `segmented-control` | pass | pass | yes |
| Slider | `slider` | pass | pass | yes |
| Spinner | `spinner` | pass | pass | yes |
| Skeleton | `skeleton` | pass | pass | yes |
| Progress | `progress` | pass | pass | yes |
| Alert | `alert` | pass | pass | yes |
| Sidebar Nav | `sidebar-nav` | pass | pass | yes |
| Breadcrumbs | `breadcrumbs` | pass | pass | yes |
| Pagination | `pagination` | pass | pass | yes |
| Command Palette | `command-palette` | pass | pass | yes |
| List Row | `list-row` | pass | pass | yes |
| Table | `table` | pass | pass | yes |
| Key-Value Row | `key-value` | pass | pass | yes |
| Stack | `stack` | pass | pass | yes |
| Toolbar | `toolbar` | pass | pass | yes |
| Popover | `popover` | pass | pass | yes |
| Dropdown Menu | `dropdown-menu` | pass | pass | yes |
| Sheet | `sheet` | pass | pass | yes |
| Icon Button | `icon-button` | pass | pass | yes |
| Kbd | `kbd` | pass | pass | yes |
| Tag | `tag` | pass | pass | yes |
| Copy Button | `copy-button` | pass | pass | yes |
| Combobox | `combobox` | pass | pass | yes |
| Number Input | `number-input` | pass | pass | yes |
| OTP Input | `otp-input` | pass | pass | yes |
| Stepper | `stepper` | pass | pass | yes |
| Rating | `rating` | pass | pass | yes |
| Accordion | `accordion` | pass | pass | yes |
| Stat Card | `stat-card` | pass | pass | yes |
| Avatar Group | `avatar-group` | pass | pass | yes |
| Progress Ring | `progress-ring` | pass | pass | yes |
| Banner | `banner` | pass | pass | yes |
| Tree View | `tree-view` | pass | pass | yes |
| Scroll Area | `scroll-area` | pass | pass | yes |
| Timer | `timer` | pass | pass | yes |
| Inline Edit | `inline-edit` | pass | pass | yes |
| Code Block | `code-block` | pass | pass | yes |
| Date Picker | `date-picker` | pass | pass | yes |
| Time Picker | `time-picker` | pass | pass | yes |
| Multi-select | `multi-select` | pass | pass | yes |
| File Upload | `file-upload` | pass | pass | yes |
| Swatch Picker | `swatch-picker` | pass | pass | yes |
| Carousel | `carousel` | pass | pass | yes |
| Timeline | `timeline` | pass | pass | yes |
| Context Menu | `context-menu` | pass | pass | yes |
| Hover Card | `hover-card` | pass | pass | yes |
| Password Input | `password-input` | pass | pass | yes |
| Data Table | `data-table` | pass | pass | yes |
| Date Range Picker | `date-range-picker` | pass | pass | yes |
| Resizable Panels | `resizable-panels` | pass | pass | yes |
| Sortable List | `sortable-list` | pass | pass | yes |
| Filter Bar | `filter-bar` | pass | pass | yes |
| Notification List | `notification-list` | pass | pass | yes |
| Image Viewer | `image-viewer` | pass | pass | yes |
| Toggle Group | `toggle-group` | pass | pass | yes |
| Link | `link` | pass | pass | yes |
| Heading | `heading` | pass | pass | yes |
| Text | `text` | pass | pass | yes |
| Color Picker | `color-picker` | pass | pass | yes |
| Tag Input | `tag-input` | pass | pass | yes |
| Infinite List | `infinite-list` | pass | pass | yes |
| Split Button | `split-button` | pass | pass | yes |
| Empty State | `empty-state` | pass | pass | yes |
| Form | `form` | pass | pass | yes |
| Calendar | `calendar` | pass | pass | yes |
| Chart | `chart` | pass | pass | yes |
| Sparkline | `sparkline` | pass | pass | yes |
| Chat Message | `chat-message` | pass | pass | yes |
| Chat Composer | `chat-composer` | pass | pass | yes |
| Navbar | `navbar` | pass | pass | yes |
| App Shell | `app-shell` | pass | pass | yes |
| Link Preview | `link-preview` | pass | pass | yes |
| Segmented Progress | `segmented-progress` | pass | pass | yes |
| Mention Input | `mention-input` | pass | pass | yes |
| Rich Text | `rich-text` | pass | pass | yes |
| Media Timeline | `media-timeline` | pass | pass | yes |
