# coding=utf-8
"""
GeoSight is UNICEF's geospatial web-based business intelligence platform.

Contact : geosight-no-reply@unicef.org

.. note:: This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation; either version 3 of the License, or
    (at your option) any later version.

"""
__author__ = 'irwan@kartoza.com'
__date__ = '13/06/2023'
__copyright__ = ('Copyright 2023, Unicef')

import os  # noqa

from django.utils.translation import ugettext_lazy as _

from .contrib import *  # noqa

DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'
ALLOWED_HOSTS = ['*']
ADMINS = (
    ('Irwan Fathurrahman', 'irwam@kartoza.com'),
)
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ['DATABASE_NAME'],
        'USER': os.environ['DATABASE_USERNAME'],
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
        'HOST': os.environ['DATABASE_HOST'],
        'PORT': 5432,
        'TEST_NAME': 'unittests',
    },
    'temp': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ['DATABASE_TEMP_NAME'],
        'USER': os.environ['DATABASE_USERNAME'],
        'PASSWORD': os.environ['DATABASE_PASSWORD'],
        'HOST': os.environ['DATABASE_HOST'],
        'PORT': 5432,
        'TEST_NAME': 'unittests',
    }
}
DATABASE_ROUTERS = ['core.router.Router']

# Due to profile page does not available,
# this will redirect to home page after login
LOGIN_REDIRECT_URL = '/'

# How many versions to list in each project box
PROJECT_VERSION_LIST_SIZE = 10

# Set debug to false for production
DEBUG = TEMPLATE_DEBUG = False

SOUTH_TESTS_MIGRATE = False

# Set languages which want to be translated
LANGUAGES = (
    ('en', _('English')),
)

# Set storage path for the translation files
LOCALE_PATHS = (ABS_PATH('locale'),)

# Extra installed apps
INSTALLED_APPS = INSTALLED_APPS + (
    'azure_auth',
    'core',
    'geosight.data',
    'geosight.georepo',
    'geosight.permission',
    'geosight.importer',
    'frontend',
)

DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000

# -------------------------------------------------- #
# ----------           ONEDRIVE         ------------ #
# -------------------------------------------------- #
ONEDRIVE_ROOT = '/onedrive/data'

# -------------------------------------------------- #
# ----------           BACKUPS          ------------ #
# -------------------------------------------------- #
BACKUPS_ROOT = '/backups'

# use custom filter to hide other sensitive informations
DEFAULT_EXCEPTION_REPORTER_FILTER = (
    'core.settings.filter.ExtendSafeExceptionReporterFilter'
)

# -------------------------------------------------- #
# ----------        AZURE CONFIG        ------------ #
# -------------------------------------------------- #
# empty config will be not using azure
AZURE_AUTH = {}
GEOREPO_AZURE_AUTH = {}

USE_AZURE = os.environ.get('AZURE_B2C_CLIENT_ID', False) not in [
    False, '', "''"]
USE_GEOREPO_B2C = USE_AZURE and os.environ.get(
    'GEOREPO_AZURE_B2C_CLIENT_ID', False) not in [False, '', "''"]
if USE_AZURE:
    LOGIN_URL = 'login'
    # redirect when user is not within Unicef group and
    # does not have GeoRepo account
    USER_NO_ACCESS_URL = ''
    LOGOUT_REDIRECT_URL = '/'
    AZURE_AUTH = {
        'CLIENT_ID': os.environ.get('AZURE_B2C_CLIENT_ID'),
        'CLIENT_SECRET': os.environ.get('AZURE_B2C_CLIENT_SECRET'),
        'TENANT_NAME': os.environ.get('AZURE_B2C_TENANT_NAME'),
        'POLICY_NAME': os.environ.get('AZURE_B2C_POLICY_NAME'),
        'RENAME_ATTRIBUTES': [
            ('given_name', 'first_name'),
            ('family_name', 'last_name'),
            ('email', 'email')
        ],
        'SAVE_ID_TOKEN_CLAIMS': False,
        # request access token
        'SCOPES': [os.environ.get('AZURE_B2C_CLIENT_ID')],
        'PUBLIC_URLS': [],
    }
    AUTHENTICATION_BACKENDS = [
                                  'azure_auth.backends.AzureAuthBackend'
                              ] + AUTHENTICATION_BACKENDS

    AZURE_REGISTERED_CLIENT_IDS = [
        AZURE_AUTH['CLIENT_ID']
    ]
    if USE_GEOREPO_B2C:
        GEOREPO_AZURE_AUTH = {
            'CLIENT_ID': os.environ.get('GEOREPO_AZURE_B2C_CLIENT_ID'),
            'CLIENT_SECRET': os.environ.get('GEOREPO_AZURE_B2C_CLIENT_SECRET'),
            'TENANT_NAME': os.environ.get('GEOREPO_AZURE_B2C_TENANT_NAME'),
            'POLICY_NAME': os.environ.get('GEOREPO_AZURE_B2C_POLICY_NAME'),
            'RENAME_ATTRIBUTES': [
                ('given_name', 'first_name'),
                ('family_name', 'last_name'),
                ('email', 'email')
            ],
            'SAVE_ID_TOKEN_CLAIMS': False,
            # request access token
            'SCOPES': [os.environ.get('GEOREPO_AZURE_B2C_CLIENT_ID')],
            'PUBLIC_URLS': [],
        }
        AZURE_REGISTERED_CLIENT_IDS.append(GEOREPO_AZURE_AUTH['CLIENT_ID'])
        GEOREPO_USER_NO_ACCESS_URL = 'georepo_auth_failed'
