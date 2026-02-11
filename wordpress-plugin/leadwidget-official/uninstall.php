<?php
/**
 * Uninstall Script
 * Fired when the plugin is uninstalled
 * Cleans up all plugin data from the database
 */

// Exit if uninstall not called from WordPress
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete plugin options
delete_option('leadwidget_user_id');
delete_option('leadwidget_enabled');

// For multisite installations
delete_site_option('leadwidget_user_id');
delete_site_option('leadwidget_enabled');

// Clear any cached data
wp_cache_flush();
