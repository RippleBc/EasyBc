class BlockAgreement
{
	constructor(ripple)
	{
		this.ripple = ripple;

		this.ripple.express.post("/consensusBlock", function(req, res) {
			if(!req.body.candidate) {
        res.send({
            code: PARAM_ERR,
            msg: "param error, need candidate"
        });
        return;
	    }

	    // vote
	    processBlock(self.ripple, req.body.candidate);
		});

		this.ripple.on("timeAgreementOver", ()=> {
			
		})
	}
}