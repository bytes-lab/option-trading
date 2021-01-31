from tiger.core.leg import OptionLeg
from tiger.utils import timestamp_to_datetime_with_default_tz

from .base import Trade


class LongCall(Trade):
    def __init__(self, stock, legs, target_price_lower=None, target_price_upper=None):
        # TODO: add validation.
        super().__init__('long_call', stock, legs, target_price_lower, target_price_upper)

    @staticmethod
    def build(stock, call_contract, target_price_lower=None, target_price_upper=None, available_cash=None):
        long_call_leg = OptionLeg(True, 1, call_contract)
        new_trade = LongCall(stock, [long_call_leg], target_price_lower=target_price_lower,
                             target_price_upper=target_price_upper)
        if available_cash and not new_trade.max_out(available_cash):
            return None
        return new_trade

    @property
    def display_name(self):
        long_call_leg = self.get_long_call_leg()
        expiration_date_str = timestamp_to_datetime_with_default_tz(long_call_leg.contract.expiration) \
            .strftime("%m/%d/%Y")
        return '[{}][Long call] {} {} strike ${} at ${:.2f} per contract' \
            .format(self.stock.ticker.symbol, '{}X'.format(long_call_leg.units) if long_call_leg.units > 1 else '',
                    expiration_date_str, long_call_leg.contract.strike, long_call_leg.contract.cost)

    @property
    def break_even_price(self):
        return self.get_long_call_leg().contract.strike + self.get_long_call_leg().contract.premium

    @property
    def profit_cap_price(self):
        return None
