<?php
/**
 * Plugin Name: LeadWidget
 * Plugin URI: https://whatsapp-leads-peru.vercel.app
 * Description: AI-powered chat widget that captures leads and sends them directly to WhatsApp. Install in seconds, no coding required.
 * Version: 1.0.0
 * Author: LeadWidget Team
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: leadwidget
 * Requires at least: 5.0
 * Requires PHP: 7.0
 */

// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

// Define plugin constants
define('LEADWIDGET_VERSION', '1.0.0');
define('LEADWIDGET_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('LEADWIDGET_PLUGIN_URL', plugin_dir_url(__FILE__));
define('LEADWIDGET_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main LeadWidget Class
 */
class LeadWidget
{

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance()
    {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct()
    {
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Load required files
     */
    private function load_dependencies()
    {
        // Include necessary files
        require_once plugin_dir_path(__FILE__) . 'admin-settings.php';
        require_once plugin_dir_path(__FILE__) . 'widget-injector.php';
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks()
    {
        // Activation/Deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Admin menu
        add_action('admin_menu', array('LeadWidget_Admin_Settings', 'add_menu'));
        add_action('admin_init', array('LeadWidget_Admin_Settings', 'register_settings'));

        // Widget injection
        add_action('wp_footer', array('LeadWidget_Injector', 'inject_widget'));

        // Admin styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // Add settings link on plugins page
        add_filter('plugin_action_links_' . LEADWIDGET_PLUGIN_BASENAME, array($this, 'add_settings_link'));
    }

    /**
     * Activation hook
     */
    public function activate()
    {
        // Set default options
        add_option('leadwidget_user_id', '');
        add_option('leadwidget_enabled', '1');

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Deactivation hook
     */
    public function deactivate()
    {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook)
    {
        // Only load on our settings page
        if ('toplevel_page_leadwidget' !== $hook) {
            return;
        }

        wp_enqueue_style(
            'leadwidget-admin',
            LEADWIDGET_PLUGIN_URL . 'assets/css/admin-style.css',
            array(),
            LEADWIDGET_VERSION
        );
    }

    /**
     * Add settings link to plugins page
     */
    public function add_settings_link($links)
    {
        $settings_link = '<a href="admin.php?page=leadwidget">' . __('Settings', 'leadwidget') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }
}

/**
 * Initialize the plugin
 */
function leadwidget_init()
{
    return LeadWidget::get_instance();
}

// Start the plugin
leadwidget_init();
