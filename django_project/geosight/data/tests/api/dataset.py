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

import copy
from datetime import datetime

from django.contrib.auth import get_user_model
from django.test.testcases import TestCase
from django.urls import reverse

from geosight.data.models import Indicator, IndicatorGroup
from geosight.georepo.models import ReferenceLayer, ReferenceLayerIndicator
from geosight.importer.importers.query_data import Aggregations
from geosight.permission.tests._base import BasePermissionTest

User = get_user_model()


class DatasetListApiTest(BasePermissionTest, TestCase):
    """Test for dataset list api."""

    payload = {
        'name': 'name',
        'aggregation_method': Aggregations.COUNT
    }

    def setUp(self):
        """To setup test."""
        payload = copy.deepcopy(self.payload)
        payload['group'] = IndicatorGroup.objects.create(name='name')

        # Create reference layers
        self.ref_0 = ReferenceLayer.objects.create(identifier='name_1')
        self.ref_1 = ReferenceLayer.objects.create(identifier='name_1')
        self.ref_2 = ReferenceLayer.objects.create(identifier='name_2')

        payload['name'] = 'name_0'
        self.indicator_0 = Indicator.objects.create(**payload)

        super(DatasetListApiTest, self).setUp()

        # Create indicators
        payload['name'] = 'name_1'
        self.indicator_1 = Indicator.objects.create(**payload)
        self.indicator_1.creator = self.creator
        self.indicator_1.save()

        payload['name'] = 'name_2'
        self.indicator_2 = Indicator.objects.create(**payload)
        self.indicator_2.creator = self.creator_in_group
        self.indicator_2.save()

        # Reference layer indicators
        self.create_reference_layer_indicator(
            self.creator, self.ref_1, self.indicator_1
        )
        self.create_reference_layer_indicator(
            self.creator, self.ref_1, self.indicator_2
        )
        self.create_reference_layer_indicator(
            self.creator_in_group, self.ref_2, self.indicator_1
        )
        self.create_reference_layer_indicator(
            self.creator_in_group, self.ref_2, self.indicator_2
        )

        # Create values
        values = [
            # Ref 1 Indicator 1
            [self.ref_1, self.indicator_1, '2020-01-01', 1, 'A', 2],
            [self.ref_1, self.indicator_1, '2020-01-01', 1, 'B', 1],
            [self.ref_1, self.indicator_1, '2020-01-01', 1, 'C', 3],
            [self.ref_1, self.indicator_1, '2020-01-01', 2, 'AA', 1],
            [self.ref_1, self.indicator_1, '2020-01-01', 2, 'BA', 1],
            [self.ref_1, self.indicator_1, '2020-05-01', 1, 'A', 3],
            [self.ref_1, self.indicator_1, '2020-05-01', 1, 'B', 4],
            [self.ref_1, self.indicator_1, '2020-05-01', 2, 'AA', 4],
            [self.ref_1, self.indicator_1, '2020-05-01', 2, 'BA', 2],
            # Ref 1 Indicator 2
            [self.ref_1, self.indicator_2, '2020-02-01', 1, 'A', 2],
            [self.ref_1, self.indicator_2, '2020-02-01', 1, 'B', 1],
            [self.ref_1, self.indicator_2, '2020-02-01', 1, 'C', 3],
            [self.ref_1, self.indicator_2, '2020-02-01', 2, 'AA', 1],
            [self.ref_1, self.indicator_2, '2020-02-01', 2, 'BA', 1],
            [self.ref_1, self.indicator_2, '2020-03-01', 1, 'A', 3],
            [self.ref_1, self.indicator_2, '2020-03-01', 1, 'B', 4],
            [self.ref_1, self.indicator_2, '2020-03-01', 2, 'AA', 4],
            [self.ref_1, self.indicator_2, '2020-03-01', 2, 'BA', 2],
            # Ref 2 Indicator 1
            [self.ref_2, self.indicator_1, '2020-05-01', 1, 'E', 2],
            [self.ref_2, self.indicator_1, '2020-05-01', 1, 'F', 1],
            [self.ref_2, self.indicator_1, '2020-05-01', 1, 'G', 3],
            [self.ref_2, self.indicator_1, '2020-05-01', 2, 'EA', 1],
            [self.ref_2, self.indicator_1, '2020-05-01', 2, 'FA', 1],
            [self.ref_2, self.indicator_1, '2020-06-01', 1, 'E', 3],
            [self.ref_2, self.indicator_1, '2020-06-01', 1, 'F', 4],
            [self.ref_2, self.indicator_1, '2020-06-01', 2, 'EA', 4],
            [self.ref_2, self.indicator_1, '2020-06-01', 2, 'FA', 2],
            # Ref 2 Indicator 2
            [self.ref_2, self.indicator_2, '2020-06-01', 1, 'E', 2],
            [self.ref_2, self.indicator_2, '2020-06-01', 1, 'F', 1],
            [self.ref_2, self.indicator_2, '2020-06-01', 1, 'G', 3],
            [self.ref_2, self.indicator_2, '2020-06-01', 2, 'EA', 1],
            [self.ref_2, self.indicator_2, '2020-06-01', 2, 'FA', 1],
            [self.ref_2, self.indicator_2, '2020-07-01', 1, 'E', 3],
            [self.ref_2, self.indicator_2, '2020-07-01', 1, 'F', 4],
            [self.ref_2, self.indicator_2, '2020-07-01', 2, 'EA', 4],
            [self.ref_2, self.indicator_2, '2020-07-01', 2, 'FA', 2],
        ]
        for value in values:
            self.create_value(
                value[0], value[1], value[2], value[3], value[4], value[5]
            )

    def create_resource(self, user):
        """Create resource function."""
        return self.create_reference_layer_indicator(
            user, self.ref_0, self.indicator_0
        )

    def create_reference_layer_indicator(
            self, user, reference_layer, indicator
    ):
        """Create resource function."""
        return ReferenceLayerIndicator.permissions.create(
            user=user,
            **{
                'reference_layer': reference_layer,
                'indicator': indicator
            }
        )

    def create_value(
            self, reference_layer: ReferenceLayer, indicator: Indicator,
            date_str,
            admin_level, geom_id, value
    ):
        """Create Indicator Value."""
        indicator.save_value(
            datetime.strptime(date_str, '%Y-%m-%d'), geom_id, value,
            reference_layer, admin_level
        )

    def get_resources(self, user):
        """Create resource function."""
        return ReferenceLayerIndicator.permissions.list(user).order_by('id')

    def test_list_api_by_admin(self):
        """Test List API."""
        url = reverse('dataset-list-api')
        response = self.assertRequestGetView(url, 200)
        self.assertEqual(len(response.json()['results']), 0)

        # admin
        user = self.admin
        response = self.assertRequestGetView(url, 200, user=user)
        self.assertEqual(len(response.json()['results']), 36)

        # by indicators
        response = self.assertRequestGetView(
            f'{url}?indicator__in={",".join([f"{self.indicator_1.id}"])}', 200,
            user=user
        )
        self.assertEqual(len(response.json()['results']), 18)

        # by reference layers
        reference_layers = ",".join([f"{self.ref_1.identifier}"])
        response = self.assertRequestGetView(
            f'{url}?reference_layer__identifier__in={reference_layers}',
            200, user=user
        )
        self.assertEqual(len(response.json()['results']), 18)

        # by levels
        response = self.assertRequestGetView(
            f'{url}?admin_level__in=1', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 20)

        # by codes
        response = self.assertRequestGetView(
            f'{url}?geom_id__in=A,B', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 8)

        # by time
        response = self.assertRequestGetView(
            f'{url}?date__gte=2020-06-01', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 13)

    def test_list_api_by_creator(self):
        """Test List API."""
        user = self.creator
        url = reverse('dataset-list-api')

        # admin
        response = self.assertRequestGetView(url, 200, user=user)
        self.assertEqual(len(response.json()['results']), 18)

        # by indicators
        response = self.assertRequestGetView(
            f'{url}?indicator__in={",".join([f"{self.indicator_1.id}"])}', 200,
            user=user
        )
        self.assertEqual(len(response.json()['results']), 18)

        response = self.assertRequestGetView(
            f'{url}?indicator__in={",".join([f"{self.indicator_2.id}"])}', 200,
            user=user
        )
        self.assertEqual(len(response.json()['results']), 0)

        # by reference layers
        reference_layers = ",".join([f"{self.ref_1.identifier}"])
        response = self.assertRequestGetView(
            f'{url}?reference_layer__identifier__in={reference_layers}',
            200, user=user
        )
        self.assertEqual(len(response.json()['results']), 9)

        # by levels
        response = self.assertRequestGetView(
            f'{url}?admin_level__in=1', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 10)

        # by codes
        response = self.assertRequestGetView(
            f'{url}?geom_id__in=A,B', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 4)

        # by time
        response = self.assertRequestGetView(
            f'{url}?date__gte=2020-06-01', 200, user=user
        )
        self.assertEqual(len(response.json()['results']), 4)
