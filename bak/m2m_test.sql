CREATE TABLE `advertiser_campaign` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `advertiser_uuid` varchar(36) NOT NULL,
  `seller_pub_uuid` varchar(36) DEFAULT NULL,
  `seller_pub_uuid_type` int(11) DEFAULT NULL,
  `update_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=319 DEFAULT CHARSET=utf8;


CREATE TABLE `advertiser_ad` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `advertiser_campaign_id` int(10) unsigned NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `status` int(1) unsigned NOT NULL,
  `update_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1504 DEFAULT CHARSET=utf8;


CREATE TABLE `advertiser_ad_data` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `value` varchar(2000) NOT NULL,
  `advertiser_ad_id` int(10) unsigned NOT NULL,
  `update_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `scope` enum('server','client') NOT NULL,
  `description` varchar(400) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `advertiser_ad_id` (`advertiser_ad_id`,`name`)
) ENGINE=InnoDB AUTO_INCREMENT=68519 DEFAULT CHARSET=utf8mb4;


CREATE TABLE `advertiser_ad_push` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `advertiser_ad_id` int(10) unsigned NOT NULL,
  `split_index` int(10) unsigned NOT NULL DEFAULT '1',
  `message` varchar(2000) DEFAULT NULL,
  `interstitial` varchar(2000) DEFAULT NULL,
  `deeplink` varchar(2000) DEFAULT NULL,
  `status` tinyint(4) DEFAULT '1',
  `update_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_dtime` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `network_ad` tinyint(4) DEFAULT NULL,
  `dynamic_interstitial_image` varchar(2048) DEFAULT NULL,
  `dynamic_interstitial_url` varchar(2048) DEFAULT NULL,
  `dynamic_interstitial_pixel` varchar(2048) DEFAULT NULL,
  `dynamic_interstitial_height` int(11) DEFAULT NULL,
  `dynamic_interstitial_width` int(11) DEFAULT NULL,
  `click_action` varchar(32) DEFAULT NULL,
  `pixels` varchar(2048) DEFAULT NULL,
  `dynamic_interstitial_html` varchar(2048) DEFAULT NULL,
  `dynamic_interstitial_scrollable` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `advertiser_ad_id` (`advertiser_ad_id`,`split_index`)
) ENGINE=InnoDB AUTO_INCREMENT=1364 DEFAULT CHARSET=utf8mb4;