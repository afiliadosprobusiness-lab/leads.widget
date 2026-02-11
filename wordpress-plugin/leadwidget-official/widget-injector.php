<?php
/**
 * Widget Injector
 * Handles the injection of LeadWidget script into the website footer
 */

// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

class LeadWidget_Injector
{

    /**
     * Inject widget script into footer
     */
    public static function inject_widget()
    {
        // Check if widget is enabled
        $enabled = get_option('leadwidget_enabled', '1');
        if ($enabled !== '1') {
            return;
        }

        // Get User ID
        $user_id = get_option('leadwidget_user_id', '');

        // Don't inject if no User ID is set
        if (empty($user_id)) {
            return;
        }

        // Don't inject in admin pages
        if (is_admin()) {
            return;
        }

        // Should we load on this specific page?
        if (!self::should_load_widget()) {
            return;
        }

        // Sanitize User ID (extra safety)
        $user_id = sanitize_text_field($user_id);

        // Build script URL
        $script_url = self::get_script_url($user_id);

        // Enqueue the script properly
        wp_enqueue_script('leadwidget-script', $script_url, array(), LEADWIDGET_VERSION, true);

        // Add async attribute via filter
        add_filter('script_loader_tag', array(__CLASS__, 'add_async_attribute'), 10, 2);
    }

    /**
     * Add async attribute to script tag
     */
    public static function add_async_attribute($tag, $handle)
    {
        if ('leadwidget-script' !== $handle) {
            return $tag;
        }
        return str_replace(' src', ' async src', $tag);
    }

    /**
     * Get the widget script URL
     * 
     * @param string $user_id User ID from settings
     * @return string Full URL to widget script
     */
    private static function get_script_url($user_id)
    {
        // Production URL
        $base_url = 'https://whatsapp-leads-peru.vercel.app';

        // Allow filtering for custom domains or staging environments
        $base_url = apply_filters('leadwidget_script_base_url', $base_url);

        return trailingslashit($base_url) . 'api/w/' . urlencode($user_id);
    }

    /**
     * Check if current page should load widget
     * 
     * @return boolean True if widget should load
     */
    public static function should_load_widget()
    {
        // Allow for conditional loading via filter
        $should_load = true;

        // Don't load on login/register pages
        if (function_exists('is_account_page') && is_account_page()) {
            $should_load = false;
        }

        if (function_exists('is_checkout') && is_checkout()) {
            $should_load = false;
        }

        // Allow theme/plugin developers to customize
        return apply_filters('leadwidget_should_load', $should_load);
    }
}
