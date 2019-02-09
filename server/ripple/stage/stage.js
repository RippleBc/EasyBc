const {checkIfAllNodeHasMet, nodeList, bfAddress} = require("../../nodes")
const {ROUND_DEFER} = require("../constant")

class Stage
{
	constructor()
	{
		// record the live node in the ripple consensus stage
		this.activeNodes = [bfAddress];
		//
		this.accessedNodes = [bfAddress]
		// timeout each stage of one round
		this.timeout = null;
	}

	checkIfCanEnterNextStage()
	{
		if(!checkIfAllNodeHasMet(this.ripple.activeNodes))
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

		return this.activeNodes;
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

		return this.accessedNodes;
	}

	/**
	 * @param {Function} func
	 */
	initTimeout(func)
	{
		this.timeout = setTimeout(func, ROUND_DEFER);
	}

	/**
	 *
	 */
	reset()
	{
		// record the live node in the ripple consensus stage
		this.activeNodes = [bfAddress];
		//
		this.accessedNodes = [bfAddress]
	}
}