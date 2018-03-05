/* global expect, agent */

const helpers = require('../helpers');
const shared = require('./shared');

describe('(/inventory/types) The inventory types http API', () => {
  // create inventory type
  it('POST /inventory/types create a new inventory types', () => {
    return agent.post('/inventory/types')
      .send(shared.inventoryType)
      .then(res => {
        shared.inventoryType.id = res.body.id;
        helpers.api.created(res);
        expect(res.body.id).to.be.equal(shared.inventoryType.id);
      })
      .catch(helpers.handler);
  });

  // update inventory type
  it('PUT /inventory/types/:id updates an existing inventory type', () => {
    return agent.put(`/inventory/types/${shared.inventoryType.id}`)
      .send(shared.updateType)
      .then(res => {
        const type = res.body[0];
        shared.updateType.id = shared.inventoryType.id;
        expect(type).to.contain.all.keys(Object.keys(shared.updateType));
        expect(type).to.be.deep.equals(shared.updateType);
      })
      .catch(helpers.handler);
  });

  // list of inventory type
  it('GET /inventory/types returns list of inventory types', () => {
    return agent.get('/inventory/types')
      .then(res => {
        expect(res).to.have.status(200);
        expect(res).to.be.a('object');
      })
      .catch(helpers.handler);
  });

  // details of inventory types
  it('GET /inventory/types returns details of an inventory type', () => {
    return agent.get(`/inventory/types/${shared.inventoryType.id}`)
      .then(res => {
        const type = res.body[0];
        expect(type).to.contain.all.keys(Object.keys(shared.inventoryType));
        expect(type).to.be.deep.equals(shared.updateType);
        helpers.api.listed(res, 1);
      })
      .catch(helpers.handler);
  });

  // delete the inventory types
  it('DELETE /inventroy/types delete an existing inventory types', () => {
    return agent.delete(`/inventory/types/${shared.inventoryType.id}`)
      .then(res => {
        helpers.api.deleted(res);
      })
      .catch(helpers.handler);
  });
});
