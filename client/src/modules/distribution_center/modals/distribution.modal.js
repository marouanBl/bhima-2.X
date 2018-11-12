angular.module('bhima.controllers')
  .controller('DistributionModalController', DistributionModalController);

DistributionModalController.$inject = [
  '$state', 'NotifyService', 'DistributionCenterService', 'PayrollConfigurationService',
  'ExchangeRateService', 'SessionService', 'transaction', '$uibModalInstance', 'PatientInvoiceService',
  'FeeCenterService', 'util',
];

function DistributionModalController(
  $state, Notify, DistributionCenter, Configuration,
  Exchange, Session, transaction, ModalInstance, Invoices, FeeCenters, util,
) {
  const vm = this;
  vm.transaction = transaction;
  vm.cancel = cancel;
  vm.enterprise = Session.enterprise;

  if (vm.transaction.updating) {
    let sumDebits = 0;
    let sumCredits = 0;
    vm.transaction.values = {};
    vm.transaction.amount_equiv = vm.transaction.debit_equiv || vm.transaction.credit_equiv;

    vm.transaction.distributionValues.forEach(item => {
      sumDebits += item.debit_equiv;
      sumCredits += item.credit_equiv;
    });

    vm.transaction.amount_equiv = sumDebits || sumCredits;
  }

  const path = vm.transaction.updating ? 'update_distribution_center' : 'distribution_center';

  // exposed methods
  vm.submit = submit;
  vm.latestViewFilters = DistributionCenter.filters.formatView();

  FeeCenters.read()
    .then((feeCenter) => {
      vm.principalFeeCenter = feeCenter.filter(item => {
        return item.is_principal;
      });

      if (vm.transaction.updating && vm.principalFeeCenter.length) {
        vm.principalFeeCenter.forEach(item => {

          vm.transaction.distributionValues.forEach(values => {
            if (item.id === values.id) {
              vm.transaction.values[item.id] = values.debit_equiv || values.credit_equiv;
            }
          });
        });
      }

      if (!vm.principalFeeCenter.length) {
        vm.noPrincilFeeCenter = true;
      }
    })
    .catch(Notify.handleError);

  function submit(DistributionForm) {
    let sumDistributed = 0;

    Object.keys(vm.transaction.values).forEach((key) => {
      sumDistributed += vm.transaction.values[key];
    });

    vm.invalidDistribution = sumDistributed !== util.roundDecimal(vm.transaction.amount_equiv, 2);

    if (DistributionForm.$invalid || vm.invalidDistribution) {
      return Notify.danger('FORM.ERRORS.INVALID');
    }

    return DistributionCenter.proceedDistribution(vm.transaction)
      .then(() => {
        Notify.success('FORM.INFO.DISTRIBUTION_SUCCESSFULLY');
        cancel();
        $state.go(path, null, { reload : true });
      })
      .catch(Notify.handleError);
  }

  function cancel() {
    ModalInstance.close();
  }
}
