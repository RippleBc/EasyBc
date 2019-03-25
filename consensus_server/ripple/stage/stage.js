const {checkIfAllNodeHasMet, nodeList, bfAddress} = require("../../nodes")
const {ROUND_DEFER} = require("../../constant")

class Stage
{
	constructor(ripple)
	{
		this.ripple = ripple;
		// record the live node in the ripple consensus stage
		this.activeNodes = [];
		// record the accessed node in the ripple consensus stage
		this.accessedNodes = []
		// timeout each stage of one round
		this.timeout = null;
	}

	checkIfCanEnterNextStage()
	{
		if(!checkIfAllNodeHasMet(this.activeNodes))
		{
			return false;
		}

		if(!checkIfAllNodeHasMet(this.accessedNodes))
		{
			return false;
		}

		return true;
	}

	/**
	 * @param {String} address
	 */
	recordActiveNode(address)
	{
		for(let i = 0; i < this.activeNodes.length; i++)
		{
			if(address === this.activeNodes[i])
			{
				return;
			}
		}

		this.activeNodes.push(address);
	}

	/**
	 * @param {String} address
	 */
	recordAccessedNode(address)
	{
		for(let i = 0; i < this.accessedNodes.length; i++)
		{
			if(address ===  this.accessedNodes[i])
			{
				return;
			}
		}

		this.accessedNodes.push(address);
	}

	/**
	 * @param {Function} func
	 */
	initTimeout()
	{
		const self = this;

		this.timeout = setTimeout(() => {
			// check if timeout is clear
			if(self.timeout === null)
			{
				return;
			}

			self.timeout = null;

			self.tryToEnterNextStage();
		}, ROUND_DEFER);
	}

	clearTimeout()
	{
		clearTimeout(this.timeout);

		this.timeout = null;
	}

	/**
	 *
	 */
	checkIfTimeoutEnd()
	{
		return this.timeout === null;
	}

	/**
	 *
	 */
	reset()
	{
		// record the live node in the ripple consensus stage
		this.activeNodes = [];
		// record the accessed node in the ripple consensus stage
		this.accessedNodes = []
	}
}

module.exports = Stage;