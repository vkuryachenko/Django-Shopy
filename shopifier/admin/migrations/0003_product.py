# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-11-04 10:51
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shopifier_admin', '0002_auto_20161104_1606'),
    ]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('body_html', models.TextField(max_length=2048, verbose_name='Description')),
                ('title', models.TextField(max_length=254, verbose_name='Title')),
            ],
        ),
    ]