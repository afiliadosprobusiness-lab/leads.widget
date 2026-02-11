# 📋 LeadWidget WordPress Plugin - Deployment Checklist

## ✅ **Plugin Development Status**

### Completed
- [x] Main plugin file (`leadwidget.php`)
- [x] Admin settings page (`includes/admin-settings.php`)
- [x] Widget injector logic (`includes/widget-injector.php`)
- [x] Uninstall cleanup (`uninstall.php`)
- [x] Admin CSS styles (`assets/css/admin-style.css`)
- [x] WordPress.org readme (`readme.txt`)
- [x] Development documentation (`README.md`)

### Pending (Before WordPress.org Submission)
- [ ] Create plugin icons (128x128, 256x256)
- [ ] Create banner images (772x250, 1544x500)
- [ ] Take screenshots (at least 3)
- [ ] Test on local WordPress installation
- [ ] Update production URL in `widget-injector.php`
- [ ] Create WordPress.org account
- [ ] Review and optimize `readme.txt` descriptions

---

## 🎨 **Required Assets**

### Icons
Create these in `assets/images/`:

1. **icon-128x128.png**
   - Square, 128x128 pixels
   - Emerald green gradient background (#00C185)
   - White chat bubble icon
   - Used in plugin list view

2. **icon-256x256.png**
   - Same as above, 256x256 pixels
   - Used for retina displays

### Banners
3. **banner-772x250.png**
   - WordPress.org plugin page header
   - Should include logo, tagline, and visual appeal
   - Text: "AI Chat Widget for WhatsApp Leads"

4. **banner-1544x500.png** (optional but recommended)
   - Retina version of banner
   - Same design, double resolution

### Screenshots
Create these in `assets/images/`:

5. **screenshot-1.png** - Settings page
   - Full screenshot of plugin settings page
   - Show clean UI with User ID field filled

6. **screenshot-2.png** - Widget on website
   - Show the widget active on a real WordPress site
   - Should look professional

7. **screenshot-3.png** - Mobile view
   - Widget on mobile device
   - WhatsApp integration preview

8. **screenshot-4.png** - Dashboard preview
   - LeadWidget dashboard (optional)

---

## 🔧 **Pre-Flight Configuration**

### 1. Update Production URL

In `includes/widget-injector.php`, line 45:

```php
// CHANGE THIS before WordPress.org submission
$base_url = 'https://leadwidget.com'; // Your production domain
```

### 2. Verify Contact Info

In `readme.txt`, verify:
- Support URL
- WhatsApp number
- Email address
- Dashboard link

### 3. Test Compatibility

Test with:
- WordPress 6.4 (latest)
- WordPress 5.0 (minimum required)
- PHP 8.0
- PHP 7.0 (minimum required)

---

## 🧪 **Testing Guide**

### Installation Test
```bash
# 1. Copy to WordPress
cp -r wordpress-plugin/leadwidget-official /path/to/wp-content/plugins/

# 2. Activate in WordPress Admin
# 3. Go to LeadWidget settings
# 4. Enter User ID
# 5. Save
```

### Verification Steps
1. **Admin Panel**
   - [ ] Settings page loads without errors
   - [ ] User ID saves correctly
   - [ ] Toggle switch works
   - [ ] Sidebar links work

2. **Frontend**
   - [ ] View page source
   - [ ] Verify script tag appears:
     ```html
     <!-- LeadWidget by LeadWidget.com -->
     <script src="https://domain.com/api/w/USER_ID" async id="leadwidget-script"></script>
     <!-- /LeadWidget -->
     ```
   - [ ] Widget loads visually

3. **Functionality**
   - [ ] Widget opens on click
   - [ ] AI responds to messages
   - [ ] WhatsApp redirect works
   - [ ] Mobile responsive

4. **Conflicts**
   - [ ] No JavaScript errors in console
   - [ ] Works with WooCommerce
   - [ ] Works with Contact Form 7
   - [ ] Works with Elementor

---

## 📤 **WordPress.org Submission Steps**

### Phase 1: Preparation (Week 1)
1. [ ] Create assets (icons, banners, screenshots)
2. [ ] Complete testing checklist
3. [ ] Update production URLs
4. [ ] Create WordPress.org account (if not exists)
5. [ ] Wait 24-48h for account approval

### Phase 2: Submission (Week 2)
1. [ ] Go to https://wordpress.org/plugins/developers/add/
2. [ ] Fill out plugin information form:
   - **Plugin Name**: LeadWidget
   - **Plugin Slug**: leadwidget (or leadwidget-official if taken)
   - **Description**: Short pitch (2-3 sentences)
   - **Plugin URL**: https://leadwidget.com
3. [ ] Upload plugin ZIP file
4. [ ] Submit for review

### Phase 3: Review (Weeks 3-4)
1. [ ] Wait for email from WordPress team (3-14 days)
2. [ ] If rejected: Fix issues and resubmit
3. [ ] If approved: Receive SVN access

### Phase 4: SVN Upload (Week 5)
```bash
# Checkout SVN repository
svn co https://plugins.svn.wordpress.org/leadwidget/

# Copy files
cd leadwidget
cp -r /path/to/plugin/* trunk/
cp icon-*.png assets/
cp banner-*.png assets/
cp screenshot-*.png assets/

# Commit
svn add trunk/* assets/*
svn ci -m "Initial commit: LeadWidget 1.0.0"

# Create version tag
svn cp trunk tags/1.0.0
svn ci -m "Tagging version 1.0.0"
```

### Phase 5: Go Live (Week 5)
1. [ ] Plugin appears on WordPress.org (15-60 min after SVN commit)
2. [ ] Verify plugin page looks correct
3. [ ] Test installation from WordPress.org
4. [ ] Announce launch (social media, email, etc.)

---

## 🚨 **Common WordPress.org Rejection Reasons**

### Must Avoid:
- ❌ Calling external APIs without user consent (We're OK - widget is opt-in)
- ❌ Minified/obfuscated code (Our code is readable ✓)
- ❌ Including libraries already in WordPress (We only use WP functions ✓)
- ❌ Non-GPL compatible license (We're GPL ✓)
- ❌ Trademark issues in plugin name (Make sure "LeadWidget" is yours)
- ❌ Spammy readme.txt (Ours is professional ✓)
- ❌ Security issues (We sanitize all inputs ✓)

---

## 📊 **Post-Launch Checklist**

### Week 1
- [ ] Monitor first installs
- [ ] Respond to support forum questions
- [ ] Fix any reported bugs immediately

### Week 2-4
- [ ] Encourage happy users to leave reviews
- [ ] Create tutorial video
- [ ] Write blog post about WordPress plugin launch

### Ongoing
- [ ] Monitor support forum daily
- [ ] Update plugin when WordPress updates
- [ ] Maintain 4.5+ star rating

---

## 🔗 **Useful Links**

- WordPress Plugin Guidelines: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/
- Plugin Handbook: https://developer.wordpress.org/plugins/
- SVN Tutorial: https://developer.wordpress.org/plugins/wordpress-org/how-to-use-subversion/
- readme.txt Validator: https://wordpress.org/plugins/developers/readme-validator/
- Plugin Directory FAQ: https://developer.wordpress.org/plugins/wordpress-org/plugin-developer-faq/

---

## 📞 **Support During Launch**

If you encounter issues:
1. Check WordPress.org support forums
2. Review plugin guidelines again
3. Contact WordPress plugin team: plugins@wordpress.org
4. Join WordPress Slack: https://make.wordpress.org/chat/

---

**Last Updated**: 2026-02-06  
**Plugin Version**: 1.0.0  
**Status**: Ready for Testing
