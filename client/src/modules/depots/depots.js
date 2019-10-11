angular.module('bhima.controllers')
  .controller('DepotManagementController', DepotManagementController);

DepotManagementController.$inject = [
  'DepotService', 'ModalService', 'NotifyService', 'uiGridConstants', '$state',
];

/**
 * Depot Management Controller
 *
 * This controller is about the depot management module in the admin zone
 * It's responsible for creating, editing and updating a depot
 */
function DepotManagementController(Depots, ModalService, Notify, uiGridConstants, $state) {
  const vm = this;

  // bind methods
  vm.deleteDepot = deleteDepot;
  vm.editDepot = editDepot;
  vm.createDepot = createDepot;
  vm.toggleFilter = toggleFilter;

  // global variables
  vm.gridApi = {};

  // options for the UI grid
  vm.gridOptions = {
    appScopeProvider  : vm,
    enableColumnMenus : false,
    fastWatch         : true,
    flatEntityAccess  : true,
    enableSorting     : true,
    onRegisterApi     : onRegisterApiFn,
    columnDefs : [
      {
        field : 'text',
        displayName : 'DEPOT.LABEL',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/label.tmpl.html',
      },
      {
        field : 'location',
        displayName : 'DEPOT.LOCATION',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/location.tmpl.html',
      },
      {
        field : 'is_warehouse',
        width : 125,
        displayName : 'DEPOT.WAREHOUSE',
        headerCellFilter : 'translate',
        cellTemplate : '/modules/depots/templates/warehouse.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
      {
        field : 'action',
        width : 80,
        displayName : '',
        cellTemplate : '/modules/depots/templates/action.tmpl.html',
        enableSorting : false,
        enableFiltering : false,
      },
    ],
  };

  function onRegisterApiFn(gridApi) {
    vm.gridApi = gridApi;
  }

  function toggleFilter() {
    vm.gridOptions.enableFiltering = !vm.gridOptions.enableFiltering;
    vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
  }

  function loadDepots() {
    vm.loading = true;

    Depots.read(null, { full : 1 })
      .then(data => {
        // format location
        vm.gridOptions.data = data.map(item => {
          item.location = item.location_uuid
            ? ''.concat(`${item.village_name} / ${item.sector_name} / ${item.province_name} `)
              .concat(`(${item.country_name})`) : '';
          return item;
        });
      })
      .catch(Notify.handleError)
      .finally(() => {
        vm.loading = false;
      });
  }

  // switch to delete warning mode
  function deleteDepot(depot) {
    ModalService.confirm('FORM.DIALOGS.CONFIRM_DELETE')
      .then(bool => {
        if (!bool) { return; }

        Depots.delete(depot.uuid)
          .then(() => {
            Notify.success('DEPOT.DELETED');
            loadDepots();
          })
          .catch(Notify.handleError);
      });
  }

  // update an existing depot
  function editDepot(depotObject) {
    $state.go('depots.edit', { depot : depotObject });
  }

  // create a new depot
  function createDepot() {
    $state.go('depots.create');
  }

  loadDepots();
}
