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

from abc import ABC
from typing import List

from geosight.data.models.indicator import Indicator
from geosight.importer.attribute import ImporterAttribute
from geosight.importer.importers.base.indicator_value import (
    AbstractImporterIndicatorValue
)
from geosight.importer.utilities import get_data_from_record


class IndicatorValueWideFormat(AbstractImporterIndicatorValue, ABC):
    """Import data in wide format for indicator value."""

    description = "Import Related Table data from excel in long format."

    @staticmethod
    def attributes_definition(**kwargs) -> List[ImporterAttribute]:
        """Return attributes of the importer."""
        return AbstractImporterIndicatorValue.attributes_definition(
            **kwargs)

    def process_data_from_records(self):
        """Run the import process."""
        self._update('Reading data')

        ref_layer_identifier = self.importer.reference_layer.identifier
        records = self.get_records()

        success = True
        total = len(records)
        adm_code_column = self.get_attribute('key_administration_code')

        clean_records = []
        notes = []
        for line_idx, record in enumerate(records):
            if not record:
                continue

            # Update log
            self._update(
                f'Processing line {line_idx}/{total}',
                progress=int((line_idx / total) * 100)
            )

            # ---------------------------------------
            # Construct data
            # ---------------------------------------
            geo_code = get_data_from_record(adm_code_column, record)

            # we check the values per indicator
            for key, value in record.items():
                if value is None:
                    continue

                if 'indicator-' in key:
                    note = {}
                    date_time, date_time_error = self.get_date_time(record)
                    indicator_id = int(key.replace('indicator-', ''))
                    data = {
                        'indicator_id': indicator_id,
                        'date_time': date_time,
                        'geo_code': geo_code,
                        'value': value,
                        'reference_layer_identifier': ref_layer_identifier
                    }
                    if not indicator_id:
                        note['indicator_id'] = 'Indicator id is empty'
                    else:
                        try:
                            self.get_indicator(data)
                        except Indicator.DoesNotExist:
                            note['indicator_id'] = 'Indicator does not exist'
                    if not geo_code:
                        note['value'] = 'administrative code is empty'
                    if not date_time:
                        note['date_time'] = 'date_time is empty'
                    if date_time_error:
                        note['date_time'] = date_time_error

                    # ----------------------------------------
                    # Check the geocode
                    code_type = self.importer.admin_code_type
                    data[code_type] = data['geo_code']

                    # Check admin level
                    try:
                        admin_level = self.get_admin_level_from_data(record)
                        data['admin_level'] = admin_level
                    except KeyError:
                        note['admin_level'] = 'Admin level is required'
                    except ValueError:
                        note['admin_level'] = 'Admin level is not integer'

                    entity, error = self.get_entity(
                        data, self.importer.admin_code_type
                    )
                    if entity:
                        data['geo_code'] = entity.geom_id
                        data['admin_level'] = entity.admin_level
                    else:
                        note[code_type] = error
                    # ----------------------------------------

                    # Save to clean records
                    clean_records.append(data)
                    notes.append(note)

                    # If there is not, failed
                    if len(note.keys()):
                        success = False

        return clean_records, notes, success
