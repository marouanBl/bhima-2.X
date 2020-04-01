/*
Migrate to next
 */
-- @lomamech 2020-03-24
ALTER TABLE `enterprise_setting` ADD COLUMN `month_average_consumption` SMALLINT(5) NOT NULL DEFAULT 6;

-- author: @jniles 2020-03-30
-- Update yearly cron syntax to 0-indexing rather than 1-indexing.
UPDATE `cron` SET `value` = '0 1 31 11 *' WHERE `label` = 'CRON.YEARLY';
