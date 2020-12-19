import math

from tiger.utils import days_from_timestamp


class OptionContract:
    def __init__(self, is_call, data_dict, stock_price):
        if 'contractSymbol' in data_dict:
            # Yahoo.
            self.is_call = is_call  # There are only 2 types of options: "call" and "put".
            self.ask = data_dict.get('ask')  # Could be None.
            self.bid = data_dict.get('bid')  # Could be None.
            self.contract_symbol = data_dict.get('contractSymbol')
            # Yahool uses GMT 12AM. We advance it to 4pm EST.
            self.expiration = data_dict.get('expiration') + 72000
            self.strike = data_dict.get('strike')
            self.change = data_dict.get('change')
            self.contract_size = data_dict.get('contractSize')
            self.currency = data_dict.get('currency')
            self.implied_volatility = data_dict.get('impliedVolatility')
            self.in_the_money = data_dict.get('inTheMoney')
            self.last_price = data_dict.get('lastPrice')
            self.last_trade_date = data_dict.get('lastTradeDate')
            self.open_interest = data_dict.get('openInterest')
            self.percent_change = data_dict.get('percentChange')
            self.volume = data_dict.get('volume')  # Could be None.
        else:
            # TD.
            for key in data_dict:
                if data_dict[key] == 'NaN':
                    data_dict[key] = None
            self.is_call = is_call
            self.ask = data_dict.get('ask')
            self.bid = data_dict.get('bid')
            self.contract_symbol = data_dict.get('symbol')
            self.expiration = int(data_dict.get('expirationDate') / 1000)
            self.strike = data_dict.get('strikePrice')
            self.change = data_dict.get('netChange')
            self.contract_size = data_dict.get('multiplier')  # 100, different from 'REGULAR' of yahoo
            self.currency = None
            self.implied_volatility = data_dict.get('volatility') / 100.0 if data_dict.get(
                'volatility') is not None else None
            self.in_the_money = data_dict.get('inTheMoney')
            self.last_price = data_dict.get('last')
            self.last_trade_date = int(data_dict.get('tradeTimeInLong') / 1000)
            self.open_interest = data_dict.get('openInterest')
            self.percent_change = data_dict.get('percentChange')  # TODO: verify data is correct.
            self.volume = data_dict.get('totalVolume')

            # TD specific data.
            self.mark = data_dict.get('mark')
            self.high_price = data_dict.get('highPrice')
            self.low_price = data_dict.get('lowPrice')
            self.open_price = data_dict.get('openPrice')
            self.time_value = data_dict.get('timeValue')
            self.bid_size = data_dict.get('bidSize')
            self.ask_size = data_dict.get('askSize')
            self.delta = data_dict.get('delta')
            self.gamma = data_dict.get('gamma')
            self.theta = data_dict.get('theta')
            self.vega = data_dict.get('vega')
            self.rho = data_dict.get('rho')
            '''
            TD data not used.
            "daysToExpiration":, "closePrice", "tradeDate", "quoteTimeInLong",
            "theoreticalOptionValue", "theoreticalVolatility", "optionDeliverablesList",
            "expirationType", "lastTradingDay", "settlementType", "deliverableNote",
            "isIndexOption", "markChange", "markPercentChange", "mini", "nonStandard"
            '''

        # Non-contract data.
        self.stock_price = stock_price
        self.days_till_expiration = days_from_timestamp(self.expiration)

    def __str__(self):
        return self.contract_symbol

    def __repr__(self):
        return self.__str__()


# TODO: align with TradeSerializer.
class Trade:
    def __init__(self, name, contract, target_price, use_as_premium='estimated'):
        self.name = name
        self.contract = contract
        self.use_as_premium = use_as_premium if use_as_premium in ('bid', 'ask', 'estimated') else 'estimated'
        self.estimated_premium = self.get_estimated_premium()  # Could be None.

        self.target_price = target_price
        self.to_target_price_ratio = self.get_to_target_price_ratio()

        self.break_even_price = self.get_break_even_price()  # Could be None.
        self.to_break_even_ratio = self.get_to_break_even_ratio()  # Could be None.

        self.gain = self.get_gain()

        self.to_strike = self.get_to_strike()
        self.to_strike_ratio = self.get_to_strike_ratio()

    def get_to_target_price_ratio(self):
        return self.target_price / self.contract.stock_price - 1.0

    # To be implemented in sub-class.
    def get_gain(self):
        pass

    # Returns None if both ask and bid are missing.
    def get_estimated_premium(self):
        if self.use_as_premium == 'estimated':
            if not self.contract.ask and not self.contract.bid and not self.contract.last_price:
                return None
            if not self.contract.ask and not self.contract.bid:
                return self.contract.last_price
            elif not self.contract.ask:
                return self.contract.bid
            elif not self.contract.bid:
                return self.contract.ask
            else:
                return (self.contract.ask + self.contract.bid) / 2.0
        elif self.use_as_premium == 'bid':
            return self.contract.bid if self.contract.bid else None
        elif self.use_as_premium == 'ask':
            return self.contract.ask if self.contract.ask else None
        else:
            return None

    def get_break_even_price(self):
        if self.get_estimated_premium() is None:
            return None
        if self.contract.is_call:
            return self.get_estimated_premium() + self.contract.strike
        else:
            return self.contract.strike - self.get_estimated_premium()

    def get_to_break_even_ratio(self):
        if self.get_break_even_price() is None:
            return None
        return (self.get_break_even_price() - self.contract.stock_price) / self.contract.stock_price

    def get_to_strike(self):
        """Positive when stock_price is below strike."""
        return self.contract.strike - self.contract.stock_price

    def get_to_strike_ratio(self):
        return self.get_to_strike() / self.contract.stock_price


class BuyCall(Trade):
    def __init__(self, contract, target_price, use_as_premium):
        super().__init__('buy_call', contract, target_price, use_as_premium)

    def get_gain(self):
        if self.break_even_price is None or self.estimated_premium is None:
            return None
        return max(-1.0, (self.target_price - self.break_even_price) / self.estimated_premium)


class BuyPut(Trade):
    def __init__(self, contract, target_price, use_as_premium):
        super().__init__('buy_put', contract, target_price, use_as_premium)

    def get_gain(self):
        if self.break_even_price is None or self.estimated_premium is None:
            return None
        return max(-1.0, (self.break_even_price - self.target_price) / self.estimated_premium)


# TODO: refactor into multiple legs.
class SellCoveredCall(Trade):
    def __init__(self, contract, target_price, use_as_premium):
        super().__init__('sell_covered_call', contract, target_price, use_as_premium)

        self.gain_cap = self.get_gain_cap()
        self.premium_gain = self.get_premium_gain()

    # TODO: to implement.
    def get_gain(self):
        return None

    def get_gain_cap(self):
        if self.estimated_premium is None:
            return None
        return (self.contract.strike + self.estimated_premium - self.contract.stock_price) \
               / self.contract.stock_price

    def get_premium_gain(self):
        if self.estimated_premium is None or self.get_gain_cap() is None:
            return None
        return min(self.estimated_premium / self.contract.stock_price, self.get_gain_cap())


# TODO: refactor into multiple legs.
class SellCashSecuredPut(Trade):
    def __init__(self, contract, target_price, use_as_premium):
        super().__init__('sell_cash_secured', contract, target_price, use_as_premium)

        self.premium_gain = self.get_premium_gain()
        self.cash_required = self.contract.strike * 100.0

    # TODO: to implement.
    def get_gain(self):
        return None

    def get_premium_gain(self):
        if self.estimated_premium is None:
            return None
        return self.estimated_premium / self.contract.stock_price

# TODO: add a sell everything now and hold cash trade.
