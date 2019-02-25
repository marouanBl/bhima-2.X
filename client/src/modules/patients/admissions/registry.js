angular.module('bhima.controllers')
  .controller('AdmissionRegistryController', AdmissionRegistryController);

AdmissionRegistryController.$inject = [
  '$state', 'VisitService', 'NotifyService', 'util', 'uiGridConstants',
  'GridColumnService', 'GridStateService',
  '$httpParamSerializer', 'LanguageService',
  'BarcodeService', 'ReceiptModal',
];

/**
 * Admission Registry Controller
 *
 * *
 * This module is responsible for the management of Admission Registry.
 */
function AdmissionRegistryController(
  $state, Visits, Notify, util, uiGridConstants,
  Columns, GridState, $httpParamSerializer, Languages, Barcode, Receipts
) {
  const vm = this;
  const cacheKey = 'AdmissionRegistry';

  vm.search = search;
  vm.patientCard = patientCard;
  vm.openColumnConfiguration = openColumnConfiguration;
  vm.onRemoveFilter = onRemoveFilter;
  vm.download = Visits.download;
  vm.downloadExcel = downloadExcel;
  vm.languageKey = Languages.key;
  vm.toggleInlineFilter = toggleInlineFilter;
  vm.openTransferModal = openTransferModal;

  // track if module is making a HTTP request for admissions
  vm.loading = false;

  const patientCardTemplate = `
    <div class="ui-grid-cell-contents">
      <a href ng-click="grid.appScope.patientCard(row.entity.patient_uuid)">{{row.entity.patient_reference}}</a>
    </div>
  `;
  const patientDetailsTemplate = `
    <div class="ui-grid-cell-contents">
      <a ui-sref="patientRecord({ patientUuid : row.entity.patient_uuid })">{{row.entity.display_name}}</a>
    </div>
  `;

  const columnDefs = [{
    field : 'ward_name',
    displayName : 'WARD.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'room_label',
    displayName : 'ROOM.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'bed_label',
    displayName : 'BED.TITLE',
    headerCellFilter : 'translate',
  }, {
    field : 'patient_reference',
    displayName : 'TABLE.COLUMNS.REFERENCE',
    headerCellFilter : 'translate',
    cellTemplate : patientCardTemplate,
  }, {
    field : 'display_name',
    displayName : 'TABLE.COLUMNS.NAME',
    headerCellFilter : 'translate',
    cellTemplate : patientDetailsTemplate,
  }, {
    field : 'hospital_no',
    displayName : 'PATIENT_RECORDS.HOSPITAL_NO',
    headerCellFilter : 'translate',
  }, {
    field : 'start_date',
    displayName : 'PATIENT_RECORDS.VISITS.ADMISSION_DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
    type : 'date',
  }, {
    field : 'end_date',
    displayName : 'PATIENT_RECORDS.VISITS.DISCHARGE_DATE',
    headerCellFilter : 'translate',
    cellFilter : 'date',
    type : 'date',
    cellTemplate : '/modules/patients/admissions/templates/end_date.cell.html',
  }, {
    field : 'duration',
    displayName : 'PATIENT_RECORDS.VISITS.DURATION',
    headerCellFilter : 'translate',
    type : 'number',
    cellTemplate : '/modules/patients/admissions/templates/duration.cell.html',
  }, {
    field : 'hospitalized',
    displayName : 'PATIENT_RECORDS.VISITS.ADMISSION_TYPE',
    headerCellFilter : 'translate',
    cellTemplate : '/modules/patients/admissions/templates/type.cell.html',
  }, {
    name : 'actions',
    displayName : '',
    cellTemplate : '/modules/patients/admissions/templates/action.cell.html',
    enableSorting : false,
    enableFiltering : false,
  }];

  vm.uiGridOptions = {
    appScopeProvider : vm,
    showGridFooter : true,
    enableSorting : true,
    enableColumnMenus : false,
    flatEntityAccess : true,
    fastWatch : true,
    columnDefs,
  };

  vm.uiGridOptions.onRegisterApi = function onRegisterApi(gridApi) {
    vm.gridApi = gridApi;
  };

  function toggleInlineFilter() {
    vm.uiGridOptions.enableFiltering = !vm.uiGridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }
  const columnConfig = new Columns(vm.uiGridOptions, cacheKey);
  const state = new GridState(vm.uiGridOptions, cacheKey);

  vm.saveGridState = state.saveGridState;
  vm.clearGridState = function clearGridState() {
    state.clearGridState();
    $state.reload();
  };

  // error handler
  function handler(error) {
    vm.hasError = true;
    Notify.handleError(error);
  }

  // this function loads admissions from the database with search filters, if passed in.
  function load(filters) {

    // flush error and loading states
    vm.hasError = false;
    toggleLoadingIndicator();

    const request = Visits.admissions.read(null, filters);

    // hook the returned admissions up to the grid.
    request
      .then((admissions) => {
        admissions.forEach((admission) => {
          admission.durationAge = util.getDuration(admission.duration);
        });

        // put data in the grid
        vm.uiGridOptions.data = admissions;
      })
      .catch(handler)
      .finally(() => {
        toggleLoadingIndicator();
      });
  }

  function search() {
    const filtersSnapshot = Visits.filters.formatHTTP();

    Visits.openAdmissionSearchModal(filtersSnapshot)
      .then((changes) => {
        Visits.filters.replaceFilters(changes);

        Visits.cacheFilters();
        vm.latestViewFilters = Visits.filters.formatView();
        return load(Visits.filters.formatHTTP(true));
      });
  }

  // remove a filter with from the filter object, save the filters and reload
  function onRemoveFilter(key) {
    Visits.removeFilter(key);
    Visits.cacheFilters();
    vm.latestViewFilters = Visits.filters.formatView();
    return load(Visits.filters.formatHTTP(true));
  }

  function openColumnConfiguration() {
    columnConfig.openConfigurationModal();
  }

  // toggles the loading indicator on or off
  function toggleLoadingIndicator() {
    vm.loading = !vm.loading;
  }

  // admission card
  function patientCard(uuid) {
    Receipts.patient(uuid);
  }

  // startup function. Checks for cached filters and loads them.  This behavior could be changed.
  function startup() {
    if ($state.params.filters.length) {
      Visits.filters.replaceFiltersFromState($state.params.filters);
      Visits.cacheFilters();
    }

    load(Visits.filters.formatHTTP(true));
    vm.latestViewFilters = Visits.filters.formatView();
  }

  function downloadExcel() {
    const filterOpts = Visits.filters.formatHTTP();
    const defaultOpts = {
      renderer : 'xlsx',
      lang : Languages.key,
      rowsDataKey : 'admissions',
      renameKeys : true,
      displayNames : columnConfig.getDisplayNames(),
    };
    // combine options
    const options = angular.merge(defaultOpts, filterOpts);
    // return  serialized options
    return $httpParamSerializer(options);
  }

  // patient transfer
  function openTransferModal(row) {
    const location = row.ward_name.concat('/', row.room_label, '/', row.bed_label);
    Visits.openTransferModal({
      patient_visit_uuid : row.uuid,
      patient_uuid : row.patient_uuid,
      patient_display_name : row.display_name,
      location,
    });
  }

  // fire up the module
  startup();
}
