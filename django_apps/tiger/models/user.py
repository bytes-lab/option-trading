from datetime import datetime, timedelta

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
from pinax.referrals.models import Referral

from .broker import Broker


class User(AbstractUser):
    okta_id = models.CharField(max_length=200, null=True, blank=True)
    nick_name = models.CharField(max_length=200, unique=True, null=True, blank=True)
    brokers = models.ManyToManyField(Broker)
    disabled_strategies = ArrayField(models.CharField(max_length=50), blank=True, null=True)

    class Meta:
        app_label = 'tiger'

    def __str__(self):
        return self.email

    def get_subscription(self):
        # return the active subscription for the user if exists
        subscription = self.subscriptions.filter(status='ACTIVE').first()

        return subscription

    def give_free_subscription(self, months=1):
        subscription = self.get_subscription()
        if subscription:
            # TODO: take care of Paypal subscription
            if subscription.type == 'MANUAL':
                subscription.expire_at = max(subscription.expire_at, datetime.now().date()) + timedelta(days=months*30)
                subscription.save()
        else:
            self.subscriptions.create(status='ACTIVE', type='MANUAL', expire_at=datetime.now() + timedelta(days=months*30))

    def add_ticker_to_watchlist(self, name, ticker):
        watchlist, _ = self.watchlists.get_or_create(name=name)
        item, created = watchlist.watchlist_items.get_or_create(ticker=ticker)

        if not created:  # modify last_updated_time
            item.last_updated_time = datetime.now()
            item.save()

    def get_broker(self):
        return self.brokers.first()

    def get_referral_link(self):
        referral = Referral.create(
            user=self,
            redirect_to=settings.FRONTEND_URL
        )

        return referral.url
