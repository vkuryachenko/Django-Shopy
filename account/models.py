from __future__ import unicode_literals

import os
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.utils.translation import ugettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

class UserManager(BaseUserManager):
    def create_user(self, email, **extra_fields):
        if not email:
            raise ValueError('The given email must be set')
            
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.is_admin = False
        user.is_staff = False
        user.is_active = False
        user.set_unusable_password()
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password, **extra_fields):
        if not email:
            raise ValueError('The given email must be set')
            
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.is_admin = True
        user.is_active = True
        user.is_staff = True
        user.save(using=self._db)
        return user

def normalization_file_name(instance, filename):
    return "avatar/img{}".format(os.path.splitext(filename)[1])

class User(AbstractBaseUser):
    email = models.EmailField(_('email address'), max_length=254, unique=True)
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)
    bio = models.TextField(_('bio (optional)'),blank=True,  max_length=2048)
    avatar_image = ThumbnailerImageField(_('Portfile photo'), blank=True, resize_source=dict(size=(100, 100)), upload_to=normalization_file_name)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(_('staff status'), default=False,)
    is_admin = models.BooleanField(default=False)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')

    def get_full_name(self):
        # The user is identified by their email address
        return self.email

    def get_short_name(self):
        # The user is identified by their email address
        return self.email

    def __unicode__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def username(self):
        "Username"
        # Simplest possible answer: All admins are staff
        return self.email
