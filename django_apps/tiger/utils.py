from datetime import datetime
from django.utils import timezone
from django.utils.timezone import make_aware, get_default_timezone


def get_raw_calls(yh_ticker, expiration_date_str):
    yh_ticker.options  # Initialize.
    internal_date = yh_ticker._expirations[expiration_date_str]
    options = yh_ticker._download_options(internal_date)
    return options.get('calls')


def get_now():
    return timezone.now()


def timestamp_to_datetime_with_default_tz(timestamp):
    return make_aware(datetime.fromtimestamp(timestamp), get_default_timezone())


# TODO: we may want to change to open market days.
def days_from_timestamp(timestamp):
    input_datetime = make_aware(datetime.fromtimestamp(timestamp), get_default_timezone())
    now = get_now()
    delta = input_datetime - now
    return delta.days


if __name__ == "__main__":
    import os
    import sys
    import django

    sys.path.append("/usr/src/app/")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_apps.settings')
    django.setup()

    import yfinance as yf

    stock = yf.Ticker('TSLA')
    print(stock.options)
    print(stock._expirations)
    calls = get_raw_calls(stock, stock.options[0])

    from tiger.classes import TargetPriceOptionContract
    from tiger.serializers import OptionContractSerializer

    contract = TargetPriceOptionContract(calls[0])
    serialized_contract = OptionContractSerializer(contract)
    print(serialized_contract.data)

    print(days_from_timestamp(1604620800))
