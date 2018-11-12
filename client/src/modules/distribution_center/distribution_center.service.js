angular.module('bhima.services')
  .service('DistributionCenterService', DistributionCenterService);

DistributionCenterService.$inject = ['PrototypeApiService', 'FilterService', 'appcache', '$uibModal'];

/**
 * @class DistributionCenterService
 * @extends PrototypeApiService
 *
 * @description
 * Encapsulates common requests to the /distribution_fee_center/ URL.
 */
function DistributionCenterService(Api, Filters, AppCache, Modal) {
  const service = new Api('/distribution_fee_center/');
  const distributionFilters = new Filters();
  const filterCache = new AppCache('distribution-center-filters');

  service.filters = distributionFilters;
  service.openSettingModal = openSettingModal;
  service.openDistributionModal = openDistributionModal;
  service.cacheFilters = cacheFilters;
  service.proceedDistribution = proceedDistribution;
  service.proceedBreackDownPercent = proceedBreackDownPercent;
  service.getDistributed = getDistributed;
  service.removeFilter = removeFilter;
  service.breackDownPercentagesModal = breackDownPercentagesModal;
  service.automaticBreackdown = automaticBreackdown;

  // get the auxiliary centers already distributed
  function getDistributed(params) {
    return service.$http.get(`/distribution_fee_center/getDistributed`, { params })
      .then(service.util.unwrapHttpResponse);
  }

  distributionFilters.registerDefaultFilters([
    { key : 'fiscal', label : 'FORM.LABELS.FISCAL_YEAR' },
    { key : 'periodFrom', label : 'FORM.LABELS.PERIOD_FROM' },
    { key : 'periodTo', label : 'FORM.LABELS.PERIOD_TO' },
    { key : 'typeFeeCenter', label : 'FORM.LABELS.TYPE' },
  ]);

  distributionFilters.registerCustomFilters([
    { key : 'trans_id', label : 'FORM.LABELS.TRANSACTION' },
    { key : 'hrRecord', label : 'FORM.LABELS.RECORD' },
    { key : 'account_id', label : 'FORM.LABELS.ACCOUNT' },
    { key : 'fee_center_id', label : 'FORM.LABELS.FEE_CENTER' },
  ]);

  if (filterCache.filters) {
    distributionFilters.loadCache(filterCache.filters);
  }

  // load filters from cache
  function cacheFilters() {
    filterCache.filters = distributionFilters.formatCache();
  }

  function loadCachedFilters() {
    distributionFilters.loadCache(filterCache.filters || {});
  }

  function removeFilter(key) {
    distributionFilters.resetFilterState(key);
  }

  /**
   * @function openSettingModal
   * @description
   * This functions opens the setting modal form for Setting of distribution.
   */
  function openSettingModal(filters) {
    return Modal.open({
      templateUrl : 'modules/distribution_center/modals/setting_distribution.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'SettingDistributionModalController as SettingDistributionModalCtrl',
      resolve : {
        filters : function filtersProvider() { return filters; },
      },
    }).result;
  }

  /**
   * @function openDistributionModal
   * @description
   * This functions opens the distribution Modal form.
   */
  function openDistributionModal(data) {
    return Modal.open({
      templateUrl : 'modules/distribution_center/modals/distribution.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'DistributionModalController as DistributionModalCtrl',
      resolve : {
        transaction : () => data,
      },
    }).result;
  }

  /**
   * @function breackDownPercentagesModal
   * @description
   * This functions opens the breackDown Percentages Modal form.
   */
  function breackDownPercentagesModal(data) {
    return Modal.open({
      templateUrl : 'modules/distribution_center/modals/breackDown.modal.html',
      size : 'md',
      animation : false,
      keyboard : false,
      backdrop : 'static',
      controller : 'BreackDownModalController as BreackDownModalCtrl',
      resolve : {
        data : () => data,
      },
    }).result;
  }


  /**
   * @function automatic Breackdown for Invoices
   * @description
   * This functions opens the distribution Modal form.
   */
  function automaticBreackdown(data) {
    return service.$http.post(`/distribution_fee_center/automatic`, { data })
      .then(service.util.unwrapHttpResponse);
  }


  // Proceed Distribution Fee Center
  function proceedDistribution(data) {
    return service.$http.post(`/distribution_fee_center/proceed`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  // Proceed Breack Down Fee Center in Percentage
  function proceedBreackDownPercent(data) {
    return service.$http.post(`/distribution_fee_center/breackDown`, { data })
      .then(service.util.unwrapHttpResponse);
  }

  return service;
}
