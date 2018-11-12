/**
* Distribution Fee Center Controller
*
* This function makes it possible to proceed to a basic distribution 
* of a profit or a cost, of an auxiliary center towards the main centers
*/

const db = require('../../../lib/db');

function proceed(req, res, next) {
  const { data } = req.body;
  const isDebtor = !!data.debit_equiv;
  const dataValues = data.values;
  const auxiliaryCenterId = data.fee_center_id || data.auxiliary_fee_center_id;
  const dataToDistribute = [];

  data.user_id = req.session.user.id;
  data.uuid = data.trans_uuid || data.uuid;

  Object.keys(dataValues).forEach((principalCenterId) => {
    const debitEquivDistributed = isDebtor ? dataValues[principalCenterId] : 0;
    const creditEquivDistributed = isDebtor ? 0 : dataValues[principalCenterId];

    if (debitEquivDistributed || creditEquivDistributed) {
      dataToDistribute.push([
        db.bid(data.uuid),
        data.trans_id,
        data.account_id,
        data.is_cost,
        auxiliaryCenterId,
        principalCenterId,
        debitEquivDistributed,
        creditEquivDistributed,
        data.currency_id,
        new Date(),
        data.user_id,
      ]);
    }
  });

  const delFeeCenterDistribution = `DELETE FROM fee_center_distribution WHERE trans_uuid = ?`;

  const sql = `INSERT INTO fee_center_distribution (
    trans_uuid, 
    trans_id, 
    account_id,
    is_cost,
    auxiliary_fee_center_id, 
    principal_fee_center_id, 
    debit_equiv, 
    credit_equiv, 
    currency_id, 
    date_distribution, user_id) VALUES ?`;

  const transaction = db.transaction();

  if (dataToDistribute.length) {
    transaction
      .addQuery(delFeeCenterDistribution, [db.bid(data.uuid)])
      .addQuery(sql, [dataToDistribute]);
  }

  transaction.execute()
    .then((results) => {
      res.status(201).json({ id : results[1].insertId });
    })
    .catch(next)
    .done();

}

exports.proceed = proceed;
