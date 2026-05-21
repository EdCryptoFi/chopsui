#[allow(deprecated_usage)]
module chop_token::chop_token {

    use sui::coin::create_currency;
    use sui::url::Url;

    public struct CHOP_TOKEN has drop {}

    fun init(_witness: CHOP_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = create_currency<CHOP_TOKEN>(
            _witness,
            9,
            b"CHOP",
            b"Chop Token",
            b"",
            option::none<Url>(),
            ctx
        );
        transfer::public_transfer(treasury_cap, tx_context::sender(ctx));
        transfer::public_transfer(metadata, tx_context::sender(ctx));
    }
}
