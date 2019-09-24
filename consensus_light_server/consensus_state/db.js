const assert = require("assert");
const { Op } = require('sequelize');

const mysql = process[Symbol.for("mysql")];

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} type
 * @param {String} title
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getLogs = async function({ offset, limit, type, title, beginTime, endTime })
{
  assert(typeof offset === 'number', `ConsensusState getLogs, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `ConsensusState getLogs, limit should be an Number, now is ${typeof limit}`);

  if (type !== undefined) {
    assert(typeof type === 'string', `ConsensusState getLogs, type should be an String, now is ${typeof type}`);
  }
  if (title) {
    assert(typeof title === 'string', `ConsensusState getLogs, title should be an String, now is ${typeof title}`);
  }
  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `ConsensusState getLogs, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `ConsensusState getLogs, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };
  if (type) {
    where.type = type;
  }
  if (title) {
    where.title = title;
  }
  return await mysql.Log.findAndCountAll({
    where: where,
    limit: limit,
    offset: offset,
    order: [['id', 'DESC']]
  });
}

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} type
 * @param {String} stage
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getTimeConsume = async function({ offset, limit, type, stage, beginTime, endTime })
{
  assert(typeof offset === 'number', `ConsensusState getTimeConsume, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `ConsensusState getTimeConsume, limit should be an Number, now is ${typeof limit}`);

  if (type !== undefined) {
    assert(typeof type === 'number', `ConsensusState getTimeConsume, type should be an Number, now is ${typeof type}`);
  }
  if (stage) {
    assert(typeof stage === 'number', `ConsensusState getTimeConsume, stage should be an Number, now is ${typeof stage}`);
  }
  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `ConsensusState getTimeConsume, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `ConsensusState getTimeConsume, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };
  if (type) {
    where.type = type;
  }
  if (stage) {
    where.stage = stage;
  }
  return await mysql.TimeConsume.findAll({
    where: where,
    limit: limit,
    offset: offset,
    order: [['id', 'DESC']]
  });
}

/**
 * @param {Number} offset
 * @param {Number} limit
 * @param {String} type
 * @param {Number} beginTime
 * @param {Number} endTime
 */
const getAbnormalNodes = async function({ offset, limit, type, beginTime, endTime })
{
  assert(typeof type === 'number', `ConsensusState getAbnormalNodes, type should be an Number, now is ${typeof type}`);
  assert(typeof offset === 'number', `ConsensusState getAbnormalNodes, offset should be an Number, now is ${typeof offset}`);
  assert(typeof limit === 'number', `ConsensusState getAbnormalNodes, limit should be an Number, now is ${typeof limit}`);

  if (beginTime !== undefined) {
    assert(typeof beginTime === 'number', `ConsensusState getAbnormalNodes, beginTime should be an Number, now is ${typeof beginTime}`);
  }
  if (endTime !== undefined) {
    assert(typeof endTime === 'number', `ConsensusState getAbnormalNodes, endTime should be an Number, now is ${typeof endTime}`);
  }

  const now = new Date()
  const where = {
    createdAt: {
      [Op.gt]: beginTime !== undefined ? new Date(beginTime) : new Date(now - 24 * 60 * 60 * 1000),
      [Op.lt]: endTime !== undefined ? new Date(endTime) : now,
    }
  };
  if (type) {
    where.type = type;
  }

  return await mysql.AbnormalNode.findAll({
    attributes: ['address', [mysql.sequelize.fn('count', mysql.sequelize.col('address')), 'frequency']],
    raw: true,
    where: where,
    group: ['address'],
    limit: limit,
    offset: offset
  });
}

module.exports = {
  getLogs,
  getTimeConsume,
  getAbnormalNodes
}