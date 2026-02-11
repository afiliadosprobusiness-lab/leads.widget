<?php
/**
 * Admin Settings Page
 * Handles the configuration interface in WordPress admin
 */

// Exit if accessed directly
if (!defined('ABSPATH'))
    exit;

class LeadWidget_Admin_Settings
{
    /**
     * Add menu page to WordPress admin
     */
    public static function add_menu()
    {
        add_menu_page(
            esc_html__('LeadWidget Settings', 'leadwidget'),      // Page title
            esc_html__('LeadWidget', 'leadwidget'),                // Menu title
            'manage_options',                              // Capability
            'leadwidget',                                  // Menu slug
            array(__CLASS__, 'render_settings_page'),     // Callback
            'dashicons-format-chat',                       // Icon
            100                                            // Position
        );
    }

    // ... lines skipped ...

    /**
     * Render the settings page
     */
    public static function render_settings_page()
    {
        // Check user permissions
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'leadwidget'));
        }

        // Get current values
        $user_id = get_option('leadwidget_user_id', '');
        $enabled = get_option('leadwidget_enabled', '1');

        ?>
        <div class="wrap leadwidget-admin-wrap">
            <div class="leadwidget-header">
                <h1>
                    <span class="dashicons dashicons-format-chat"></span>
                    <?php echo esc_html__('LeadWidget Configuration', 'leadwidget'); ?>
                </h1>
                <p class="description">
                    <?php echo esc_html__('AI-powered chat widget that captures leads and sends them to WhatsApp automatically.', 'leadwidget'); ?>
                </p>
            </div>

            <?php settings_errors('leadwidget_messages'); ?>

            <div class="leadwidget-content">
                <div class="leadwidget-main">
                    <form method="post" action="options.php" class="leadwidget-form">
                        <?php settings_fields('leadwidget_settings'); ?>

                        <table class="form-table" role="presentation">
                            <tbody>
                                <!-- Enable/Disable Widget -->
                                <tr>
                                    <th scope="row">
                                        <label for="leadwidget_enabled">
                                            <?php echo esc_html__('Widget Status', 'leadwidget'); ?>
                                        </label>
                                    </th>
                                    <td>
                                        <label class="leadwidget-toggle">
                                            <input type="checkbox" id="leadwidget_enabled" name="leadwidget_enabled" value="1"
                                                <?php checked($enabled, '1'); ?> />
                                            <span class="leadwidget-toggle-slider"></span>
                                        </label>
                                        <p class="description">
                                            <?php echo esc_html__('Enable or disable the widget on your website.', 'leadwidget'); ?>
                                        </p>
                                    </td>
                                </tr>

                                <!-- User ID / License Key -->
                                <tr>
                                    <th scope="row">
                                        <label for="leadwidget_user_id">
                                            <?php echo esc_html__('User ID / License Key', 'leadwidget'); ?>
                                            <span class="required">*</span>
                                        </label>
                                    </th>
                                    <td>
                                        <input type="text" id="leadwidget_user_id" name="leadwidget_user_id"
                                            value="<?php echo esc_attr($user_id); ?>" class="regular-text code"
                                            placeholder="e.g., abc123xyz" required />
                                        <p class="description">
                                            <?php
                                            printf(
                                                wp_kses(
                                                    /* translators: %s: URL to dashboard */
                                                    __('Get your User ID from your <a href="%s" target="_blank">LeadWidget Dashboard</a>.', 'leadwidget'),
                                                    array('a' => array('href' => array(), 'target' => array()))
                                                ),
                                                'https://leadwidget.com/dashboard'
                                            );
                                            ?>
                                        </p>

                                        <?php if (!empty($user_id)): ?>
                                            <div class="leadwidget-status-badge active">
                                                <span class="dashicons dashicons-yes-alt"></span>
                                                <?php echo esc_html__('Widget Active', 'leadwidget'); ?>
                                            </div>
                                        <?php else: ?>
                                            <div class="leadwidget-status-badge inactive">
                                                <span class="dashicons dashicons-warning"></span>
                                                <?php echo esc_html__('Widget Inactive - Enter your User ID', 'leadwidget'); ?>
                                            </div>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <?php submit_button(__('Save Settings', 'leadwidget'), 'primary large'); ?>
                    </form>
                </div>

                <!-- Sidebar -->
                <div class="leadwidget-sidebar">
                    <!-- Help Card -->
                    <div class="leadwidget-card">
                        <h3>
                            <span class="dashicons dashicons-sos"></span>
                            <?php echo esc_html__('Need Help?', 'leadwidget'); ?>
                        </h3>
                        <ul class="leadwidget-links">
                            <li>
                                <a href="https://leadwidget.com/dashboard" target="_blank">
                                    <span class="dashicons dashicons-dashboard"></span>
                                    <?php echo esc_html__('Go to Dashboard', 'leadwidget'); ?>
                                </a>
                            </li>
                            <li>
                                <a href="https://leadwidget.com/docs" target="_blank">
                                    <span class="dashicons dashicons-book-alt"></span>
                                    <?php echo esc_html__('Documentation', 'leadwidget'); ?>
                                </a>
                            </li>
                            <li>
                                <a href="https://wa.me/51924464410" target="_blank">
                                    <span class="dashicons dashicons-whatsapp"></span>
                                    <?php echo esc_html__('WhatsApp Support', 'leadwidget'); ?>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <!-- Features Card -->
                    <div class="leadwidget-card">
                        <h3>
                            <span class="dashicons dashicons-star-filled"></span>
                            <?php echo esc_html__('Features', 'leadwidget'); ?>
                        </h3>
                        <ul class="leadwidget-features">
                            <li><span class="dashicons dashicons-yes"></span>
                                <?php echo esc_html__('AI-Powered Conversations', 'leadwidget'); ?>
                            </li>
                            <li><span class="dashicons dashicons-yes"></span>
                                <?php echo esc_html__('WhatsApp Integration', 'leadwidget'); ?>
                            </li>
                            <li><span class="dashicons dashicons-yes"></span>
                                <?php echo esc_html__('Lead Qualification', 'leadwidget'); ?>
                            </li>
                            <li><span class="dashicons dashicons-yes"></span>
                                <?php echo esc_html__('Mobile Optimized', 'leadwidget'); ?>
                            </li>
                            <li><span class="dashicons dashicons-yes"></span>
                                <?php echo esc_html__('Real-time Analytics', 'leadwidget'); ?>
                            </li>
                        </ul>
                    </div>

                    <!-- Affiliate Card -->
                    <div class="leadwidget-card leadwidget-card-highlight">
                        <h3>
                            <span class="dashicons dashicons-money-alt"></span>
                            <?php echo esc_html__('Earn with Affiliates', 'leadwidget'); ?>
                        </h3>
                        <p>
                            <?php echo esc_html__('Refer clients and earn 20% commission on every sale!', 'leadwidget'); ?>
                        </p>
                        <a href="https://leadwidget.com/afiliados" target="_blank" class="button button-secondary">
                            <?php echo esc_html__('Learn More', 'leadwidget'); ?>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
}
