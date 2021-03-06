# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-12-21 13:20
from __future__ import unicode_literals

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion
import shopifier.admin.models


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
                ('options', django.contrib.postgres.fields.jsonb.JSONField()),
            ],
        ),
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(blank=True, null=True)),
                ('position', models.IntegerField()),
                ('src', models.ImageField(upload_to=shopifier.admin.models.normalization_img_file_name)),
                ('updated_at', models.DateTimeField(default=shopifier.admin.models.now)),
                ('alt_text', models.CharField(blank=True, max_length=254, verbose_name='Image alt text')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='shopifier_admin.Product')),
            ],
        ),
        migrations.AlterField(
            model_name='customer',
            name='created_at',
            field=models.DateTimeField(default=shopifier.admin.models.now, verbose_name='When the customer was created'),
        ),
        migrations.AlterField(
            model_name='customer',
            name='updated_at',
            field=models.DateTimeField(default=shopifier.admin.models.now, verbose_name='Information was updated'),
        ),
        migrations.AlterField(
            model_name='user',
            name='date_joined',
            field=models.DateTimeField(default=shopifier.admin.models.now, verbose_name='date joined'),
        ),
        migrations.AlterField(
            model_name='userlog',
            name='visit_datetime',
            field=models.DateTimeField(default=shopifier.admin.models.now, null=True),
        ),
    ]
