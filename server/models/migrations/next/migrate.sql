/*
 * @author: mbayopanda
 * @date: 2021-08-24
 * @desc: set to decimal the min months of security stock
 */
ALTER TABLE `stock_setting` MODIFY COLUMN `default_min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2;
ALTER TABLE `depot` MODIFY COLUMN `min_months_security_stock` DECIMAL(19,4) NOT NULL DEFAULT 2;
ALTER TABLE `depot` MODIFY COLUMN `default_purchase_interval` DECIMAL(19,4) NOT NULL DEFAULT 2;

/* migrate v1.21.0 to next */

/**
author: @jniles
date: 2021-08-30
description: adds cost columns and indices to relevant tables
*/

DROP TABLE IF EXISTS `cost_center_aggregate`;
CREATE TABLE `cost_center_aggregate` (
  `period_id`       MEDIUMINT(8) UNSIGNED NOT NULL,
  `debit`           DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `credit`          DECIMAL(19,4) UNSIGNED NOT NULL DEFAULT 0.00,
  `cost_center_id`  MEDIUMINT(8) UNSIGNED NOT NULL,
  `principal_center_id` MEDIUMINT(8) UNSIGNED NULL,
  KEY `cost_center_id` (`cost_center_id`),
  KEY `principal_center_id` (`principal_center_id`),
  KEY `period_id` (`period_id`),
  CONSTRAINT `cost_center_aggregate__period` FOREIGN KEY (`period_id`) REFERENCES `period` (`id`),
  CONSTRAINT `cost_center_aggregate__cost_center_id` FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`),
  CONSTRAINT `cost_center_aggregate__principal_center_id` FOREIGN KEY (`principal_center_id`) REFERENCES `fee_center` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

CALL add_column_if_missing('posting_journal', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');
CALL add_column_if_missing('posting_journal', 'principal_center_id', 'MEDIUMINT(8) UNSIGNED NULL');

CALL add_constraint_if_missing('posting_journal', 'pg__cost_center_1', 'FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');
CALL add_constraint_if_missing('posting_journal', 'pg__cost_center_2', 'FOREIGN KEY (`principal_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');

CALL add_column_if_missing('general_ledger', 'cost_center_id', 'MEDIUMINT(8) UNSIGNED NULL');
CALL add_column_if_missing('general_ledger', 'principal_center_id', 'MEDIUMINT(8) UNSIGNED NULL');

CALL add_constraint_if_missing('general_ledger', 'general_ledger__cost_center_1', 'FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');
CALL add_constraint_if_missing('general_ledger', 'general_ledger__cost_center_2', 'FOREIGN KEY (`principal_center_id`) REFERENCES `fee_center` (`id`) ON UPDATE CASCADE');

/**
author: @jmcameron
date: 2021-09-01
description: adds allocation basis data to cost centers
*/
CREATE TABLE IF NOT EXISTS `cost_center_basis` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY  (`name`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cost_center_basis_value` (
  `id` MEDIUMINT(8) UNSIGNED NOT NULL AUTO_INCREMENT,
  `quantity` DECIMAL(19,4) NOT NULL DEFAULT 0,
  `cost_center_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  `basis_id` MEDIUMINT(8) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `cost_center_basis_value__fee_center` FOREIGN KEY (`cost_center_id`) REFERENCES `fee_center` (`id`),
  CONSTRAINT `cost_center_basis_value__basis` FOREIGN KEY (`basis_id`) REFERENCES `cost_center_basis` (`id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET = utf8mb4 DEFAULT COLLATE = utf8mb4_unicode_ci;

/**
author: @jmcameron
date: 2021-09-07
description: Edit cost center allocation basis
*/
CALL add_column_if_missing('cost_center_basis', 'units', "VARCHAR(30) DEFAULT '' AFTER `name`");

/*
 * @author: mbayopanda
 * @date: 2021-09-02
 * @desc: fee center report tables and test data
 */
CALL add_column_if_missing('fee_center', 'step_order', 'SMALLINT(5) NOT NULL DEFAULT 0');
CALL add_column_if_missing('fee_center', 'allocation_basis_id', 'MEDIUMINT(8) UNSIGNED');
CALL add_column_if_missing('fee_center', 'allocation_method', "VARCHAR(14) NOT NULL DEFAULT 'proportional'");

INSERT IGNORE INTO `unit` VALUES
  (298, 'Cost Center Step-down','TREE.COST_CENTER_STEPDOWN','The cost center report with step-down algorithm', 286,'/reports/cost_center_step_down');

ALTER TABLE `cost_center_basis` MODIFY COLUMN `name` VARCHAR(200) NOT NULL;

/**
author: @jmcameron
date: 2021-09-09, updated 2021-09-15
description: Create cost basis items
*/
CALL add_column_if_missing('cost_center_basis', 'description', 'TEXT DEFAULT NULL AFTER `name`');
CALL add_column_if_missing('cost_center_basis', 'is_predefined', 'BOOLEAN NOT NULL DEFAULT 0 AFTER `description`');

/**
 * THE USE OF RENAME IMPLY THAT TABLES EXISTS BEFORE TO RENAME
 * AFTER A FRESH BUILD (yarn build:db) THIS CODES ARE NOT NECESSARY
 */
RENAME TABLE fee_center TO cost_center,
             reference_fee_center TO reference_cost_center,
             fee_center_distribution TO cost_center_allocation,
             service_fee_center TO service_cost_center,
             distribution_key TO allocation_key;

ALTER TABLE `cost_center_allocation` RENAME COLUMN `auxiliary_fee_center_id` TO `auxiliary_cost_center_id`;
ALTER TABLE `cost_center_allocation` RENAME COLUMN `principal_fee_center_id` TO `principal_cost_center_id`;
ALTER TABLE `service_cost_center` RENAME COLUMN `fee_center_id` TO `cost_center_id`;
ALTER TABLE `reference_cost_center` RENAME COLUMN `fee_center_id` TO `cost_center_id`;
ALTER TABLE `allocation_key` RENAME COLUMN `auxiliary_fee_center_id` TO `auxiliary_cost_center_id`;
ALTER TABLE `allocation_key` RENAME COLUMN `principal_fee_center_id` TO `principal_cost_center_id`;

/**
author: mbayopanda
date: 2021-09-14
description: rename allocation tables
*/
RENAME TABLE cost_center_basis TO cost_center_allocation_basis,
             cost_center_basis_value TO cost_center_allocation_basis_value;

UPDATE `unit` SET `path` = '/cost_center', `key` = 'TREE.COST_CENTER_MANAGEMENT' WHERE id = 218;
UPDATE `unit` SET `path` = '/cost_center', `key` = 'TREE.COST_CENTER' WHERE id = 219;
UPDATE `unit` SET `path` = '/allocation_center' WHERE id = 220;
UPDATE `unit` SET `path` = '/allocation_center/update' WHERE id = 221;
UPDATE `unit` SET `path` = '/allocation_center/allocation_key', `key` = 'TREE.ALLOCATION_KEYS' WHERE id = 223;
UPDATE `unit` SET `path` = '/reports/cost_center', `key` = 'TREE.COST_CENTER_REPORT' WHERE id = 222;
UPDATE `unit` SET `path` = '/reports/break_even_cost_center', `key` = 'TREE.BREAK_EVEN_COST_CENTER_REPORT' WHERE id = 232;
UPDATE `unit` SET `path` = '/cost_center/reports' WHERE id = 286;
UPDATE `unit` SET `path` = '/reports/cost_center_step_down', `key` = 'TREE.COST_CENTER_STEPDOWN'  WHERE id = 298;

UPDATE `report` SET `report_key` = 'cost_center', `title_key` = 'REPORT.COST_CENTER.TITLE' WHERE `report_key` = 'fee_center' OR `report_key` = 'cost_center';
UPDATE `report` SET `report_key` = 'break_even_cost_center', `title_key` = 'TREE.BREAK_EVEN_COST_CENTER_REPORT'  WHERE `report_key` = 'break_even_fee_center' OR `report_key` = 'break_even_cost_center';
UPDATE `report` SET `report_key` = 'cost_center_step_down', `title_key` = 'TREE.COST_CENTER_STEPDOWN'  WHERE `report_key` = 'fee_center_step_down' OR `report_key` = 'cost_center_step_down';


/**
author: @jmcameron
date: 2021-09-15
description: Add cost basis items
*/
INSERT IGNORE INTO `cost_center_allocation_basis` VALUES
  (4, 'ALLOCATION_BASIS_ELECTRICITY_CONSUMED', 'kWh', 'ALLOCATION_BASIS_ELECTRICITY_CONSUMED_DESCRIPTION', 1),
  (5, 'ALLOCATION_BASIS_NUM_COMPUTERS', '', 'ALLOCATION_BASIS_NUM_COMPUTERS_DESCRIPTION', 1),
  (6, 'ALLOCATION_BASIS_NUM_LABOR_HOURS', 'h', 'ALLOCATION_BASIS_NUM_LABOR_HOURS_DESCRIPTION', 1);
  
/*
 * @author: mbayopanda
 * @date: 2021-09-12
 * @desc: cost center allocation registry
 */
INSERT IGNORE INTO `unit` VALUES 
  (299, 'Allocation Keys','TREE.COST_CENTER_ALLOCATION_KEYS','List cost center allocation keys with values', 218,'/cost_center/allocation_keys');

ALTER TABLE `cost_center_allocation_basis_value`
  ADD CONSTRAINT unique_allocation_cost_center_basis UNIQUE (`cost_center_id`, `basis_id`);
  