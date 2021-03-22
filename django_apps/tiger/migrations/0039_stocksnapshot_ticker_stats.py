# Generated by Django 3.1.2 on 2021-03-21 22:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tiger', '0038_auto_20210321_1546'),
    ]

    operations = [
        migrations.AddField(
            model_name='stocksnapshot',
            name='ticker_stats',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.CASCADE, to='tiger.tickerstats'),
        ),
    ]
