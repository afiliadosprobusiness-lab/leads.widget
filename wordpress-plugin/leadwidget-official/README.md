# LeadWidget Official WordPress Plugin

Official WordPress plugin for LeadWidget - AI-powered chat widget for WhatsApp lead capture.

## 📁 Structure

```
leadwidget-official/
├── leadwidget.php              # Main plugin file
├── readme.txt                  # WordPress.org readme
├── uninstall.php              # Cleanup on uninstall
├── includes/
│   ├── admin-settings.php      # Admin settings page
│   └── widget-injector.php     # Script injection logic
└── assets/
    └── css/
        └── admin-style.css     # Admin UI styles
```

## 🚀 Installation for Testing

### Option 1: Copy to WordPress (Recommended)

```bash
# Copy plugin folder to WordPress plugins directory
cp -r wordpress-plugin/leadwidget-official /path/to/wordpress/wp-content/plugins/

# Or on Windows
xcopy wordpress-plugin\leadwidget-official C:\xampp\htdocs\wordpress\wp-content\plugins\leadwidget-official\ /E /I
```

Then:
1. Go to WordPress Admin → Plugins
2. Find "LeadWidget"
3. Click "Activate"
4. Go to LeadWidget → Settings
5. Enter your User ID
6. Save

### Option 2: Create ZIP for Upload

```bash
cd wordpress-plugin
zip -r leadwidget-official.zip leadwidget-official/

# Or on Windows (PowerShell)
Compress-Archive -Path leadwidget-official -DestinationPath leadwidget-official.zip
```

Then upload via WordPress Admin → Plugins → Add New → Upload Plugin

## 🔧 Configuration

The plugin needs:
1. **User ID** - Get from https://leadwidget.com/dashboard
2. **Widget Enabled** - Toggle to enable/disable

That's it! The plugin automatically injects the widget script on all pages.

## 📝 Important Notes

### Backend URL

The plugin currently points to:
```
https://whatsapp-leads-peru.vercel.app/api/w/[USER_ID]
```

**Before publishing to WordPress.org**, update the URL in `includes/widget-injector.php` (line 45) to your production domain:

```php
$base_url = 'https://leadwidget.com'; // or your custom domain
```

### Assets Needed for WordPress.org

Before submitting to WordPress.org, you'll need to create:

**Required Images:**
- `assets/images/icon-128x128.png` - Plugin icon (square, 128x128px)
- `assets/images/icon-256x256.png` - Plugin icon (square, 256x256px)  
- `assets/images/banner-772x250.png` - Header banner (772x250px)
- `assets/images/banner-1544x500.png` - Retina header (1544x500px)
- `assets/images/screenshot-1.png` - Settings page screenshot
- `assets/images/screenshot-2.png` - Widget in action screenshot

### Testing Checklist

Before deploying:

- [ ] Plugin activates without errors
- [ ] Settings page loads correctly
- [ ] User ID saves properly
- [ ] Widget script appears in footer HTML
- [ ] Widget loads on frontend
- [ ] Toggle enable/disable works
- [ ] No conflicts with popular themes (Astra, GeneratePress, OceanWP)
- [ ] No conflicts with popular plugins (WooCommerce, Elementor)
- [ ] Works on PHP 7.0+
- [ ] Works on WordPress 5.0+

## 🌐 WordPress.org Submission Process

1. **Create Account** at https://wordpress.org
2. **Wait 24-48h** for account approval
3. **Prepare Assets** (icons, banners, screenshots)
4. **Submit Plugin** at https://wordpress.org/plugins/developers/add/
5. **Wait 3-14 days** for review
6. **Upload to SVN** once approved
7. **Tag Version** 1.0.0

Detailed guide: https://developer.wordpress.org/plugins/wordpress-org/

## 📄 License

GPLv2 or later

## 🤝 Support

- Dashboard: https://leadwidget.com/dashboard
- WhatsApp: https://wa.me/51924464410
- Email: support@leadwidget.com
