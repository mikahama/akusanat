# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='WikiUpdateQueue',
            fields=[
                ('lemma', models.CharField(max_length=500, serialize=False, primary_key=True)),
                ('language', models.CharField(max_length=30)),
            ],
        ),
    ]
