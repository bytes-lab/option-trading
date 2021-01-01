# Generated by Django 3.1.2 on 2021-01-01 06:36

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    replaces = [('tiger', '0014_auto_20201231_1948'), ('tiger', '0015_auto_20210101_0018'), ('tiger', '0016_auto_20210101_0112'), ('tiger', '0017_auto_20210101_0128')]

    dependencies = [
        ('tiger', '0013_auto_20201225_1612'),
    ]

    operations = [
        migrations.CreateModel(
            name='StockSnapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('last_updated_time', models.DateTimeField(auto_now=True)),
                ('external_cache', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='tiger.externalrequestcache')),
                ('ticker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tiger.ticker')),
            ],
            options={
                'unique_together': set(),
            },
        ),
        migrations.CreateModel(
            name='OptionContractSnapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('last_updated_time', models.DateTimeField(auto_now=True)),
                ('is_call', models.BooleanField()),
                ('strike', models.FloatField()),
                ('expiration_timestamp', models.PositiveIntegerField()),
                ('external_cache', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='tiger.externalrequestcache')),
                ('ticker', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tiger.ticker')),
                ('premium', models.FloatField(blank=True, null=True)),
            ],
            options={
                'unique_together': set(),
            },
        ),
        migrations.CreateModel(
            name='TradeSnapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('last_updated_time', models.DateTimeField(auto_now=True)),
                ('type', models.CharField(choices=[('unspecified', 'Unspecified'), ('long_call', 'Long call'), ('covered_call', 'Covered call'), ('long_put', 'Long put'), ('cash_secured_put', 'Cash secured put')], default='unspecified', max_length=100)),
                ('is_public', models.BooleanField(default=False)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='trades', to=settings.AUTH_USER_MODEL)),
                ('leg_snapshots', models.ManyToManyField(to='tiger.Leg')),
                ('stock_snapshot', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='tiger.stocksnapshot')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='LegSnapshot',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_time', models.DateTimeField(auto_now_add=True)),
                ('last_updated_time', models.DateTimeField(auto_now=True)),
                ('is_long', models.BooleanField()),
                ('units', models.PositiveIntegerField()),
                ('cash_snapshot', models.PositiveIntegerField(blank=True, null=True)),
                ('contract_snapshot', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='tiger.optioncontractsnapshot')),
                ('stock_snapshot', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='tiger.stocksnapshot')),
            ],
            options={
                'unique_together': set(),
            },
        ),
    ]
