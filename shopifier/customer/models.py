from __future__ import unicode_literals

from django.db import models
from django.utils import timezone

from django.utils.translation import ugettext_lazy as _

from pycountry import countries, subdivisions 

__all__ = [
    'Customer',
    'Address',
]

"""
https://help.shopify.com/api/reference/customer
"""

class Customer(models.Model):

    STATES = (
        ('disabled', 'disabled'),
        ('decline', 'decline'),
        ('invited', 'invited'),
    )

    accepts_marketing = models.BooleanField(_('Customer accepts marketing'), default=False)
    #addresses
    created_at = models.DateTimeField(_('When the customer was created'), default=timezone.now)
    default_address = models.OneToOneField('Address', related_name='+', null=True)
    email = models.EmailField(_('Email'), max_length=254, blank=True)
    first_name = models.CharField(_('First Name'), max_length=30, blank=True)
    last_name = models.CharField(_('Last Name'), max_length=30, blank=True)
    #metafield
    #multipass_identifier
    note = models.TextField(_('Notes'), blank=True, max_length=254)
    state = models.CharField(max_length=20, choices=STATES, default = 'disabled')
    tags = models.CharField(_('Tags'), blank=True, max_length=254)
    tax_exempt = models.BooleanField(_('Customer is tax exempt'), default=True)
    #total_spent
    updated_at = models.DateTimeField(_('Information was updated'), default=timezone.now)
    verified_email = models.BooleanField(default=True)
    

class Address(models.Model):
    
    #These countries are not in pycountry
    EXTRA_COUNTRY_CHOICES = [
        ('XK', _('Kosovo')),
    ]
    #TODO: add more countries
    COUNTRY_CHOICES = [(c.alpha2, getattr(c, 'common_name', c.name))
                       for c in countries]
    #COUNTRY_CHOICES += EXTRA_COUNTRY_CHOICES
    PROVINCE_CHOICES = [(c.code, c.name )
                       for c in subdivisions]
    

    customer = models.ForeignKey(Customer, related_name='addresses')
    address1 = models.CharField(_('Address'), blank=True, max_length=254)
    address2 = models.CharField(_("Address Con't"), blank=True, max_length=254)
    first_name = models.CharField(_('First Name'), max_length=30, blank=True)
    last_name = models.CharField(_('Last Name'), max_length=30, blank=True)
    phone = models.CharField(_('Phone'), max_length=30, blank=True)
    city = models.CharField(_('City'), blank=True, null=True, max_length=54)
    company = models.CharField(_('Company'), blank=True, max_length=254)
    #country
    country_code = models.CharField(_('Coutry'), max_length=2, choices=COUNTRY_CHOICES, null=True)
    #country_name
    #defaul
    province = models.CharField(_('Region'), blank=True, max_length=254)
    province_code = models.CharField(_('Region'), max_length=6, choices=PROVINCE_CHOICES, blank=True)
    zip = models.CharField(_('Postal / Zip Code'), blank=True, max_length=20)
    
    @property
    def default(self):
        return self.customer.default_address_id == self.id
        