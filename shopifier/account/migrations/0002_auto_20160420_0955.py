# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-04-20 03:55
from __future__ import unicode_literals

import account.models
from django.db import migrations, models
import easy_thumbnails.fields


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='avatar_image',
            field=easy_thumbnails.fields.ThumbnailerImageField(blank=True, upload_to=account.models.normalization_file_name),
        ),
        migrations.AddField(
            model_name='user',
            name='bio',
            field=models.TextField(blank=True, max_length=2048, verbose_name='bio (optional)'),
        ),
        migrations.AddField(
            model_name='user',
            name='is_staff',
            field=models.BooleanField(default=False, verbose_name='staff status'),
        ),
    ]