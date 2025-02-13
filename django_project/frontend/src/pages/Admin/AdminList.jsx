/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '13/06/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

import React, {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import $ from "jquery";

import {
  AddButton,
  DeleteButton,
  ThemeButton
} from '../../components/Elements/Button'
import Admin from './index';
import { List } from './Components/List'

import './style.scss';
import EditIcon from "@mui/icons-material/Edit";


/**
 * Admin List App
 * @param {list} columns Columns setup.
 * @param {String} pageName Page Name.
 * @param {String} listUrl Url for list row.
 * @param {function} selectionChanged Function when selection changed.
 * @param {list} initData If there is init data.
 * @param {React.Component} rightHeader Right header.
 * @param {Array} sortingDefault Default for sorting.
 * @param {str} searchDefault Default for search.
 * @param {React.Component} children React component to be rendered
 */

export const AdminList = forwardRef(
  ({
     columns, pageName,
     listUrl, selectionChanged,
     initData = null,
     rightHeader = null,
     sortingDefault = null,
     searchDefault = null,
     multipleDelete = null,
     ...props
   }, ref
  ) => {
    const [data, setData] = useState([]);
    const [selectionModel, setSelectionModel] = useState([]);
    const selectionModelIds = selectionModel.map(model => model.id ? model.id : model)
    const [isDeleting, setIsDeleting] = useState(false)
    const listRef = useRef(null);

    /** Refresh data **/
    useImperativeHandle(ref, () => ({
      refresh() {
        listRef.current.refresh()
      }
    }));

    // When selection changed
    useEffect(() => {
      if (selectionChanged) {
        selectionChanged(selectionModel)
      }
    }, [selectionModel])


    /** Render **/
    let selectableFunction = !isDeleting
    if (!isDeleting && (multipleDelete || urls.api.batch)) {
      selectableFunction = (params) => {
        const { permission } = params.row
        return !permission || permission.edit || permission.delete
      }
    }

    const selectedModelData = data.filter(row => selectionModel.includes(row.id))
    const deleteButton = () => {
      if (user.is_creator && multipleDelete && listUrl) {
        const selectedIds = selectedModelData.filter(row => !row.permission || row.permission.delete).map(row => row.id)
        return <DeleteButton
          disabled={isDeleting || !selectedIds.length}
          variant="secondary Reverse"
          text={"Delete " + (selectedIds.length ? `(${selectedIds.length} Selected)` : "")}
          onClick={() => {
            const deleteWarning = "WARNING! Do you want to delete the selected data? This will apply directly to database."
            if (confirm(deleteWarning) === true) {
              setIsDeleting(true)
              $.ajax({
                url: listUrl,
                method: 'DELETE',
                data: {
                  'ids': JSON.stringify(selectedIds)
                },
                success: function () {
                  setIsDeleting(false)
                  listRef.current.refresh()
                },
                error: function () {
                  setIsDeleting(false)
                },
                beforeSend: beforeAjaxSend
              });
              return false;
            }
          }}
        />
      }
    }
    const createButton = () => {
      if (user.is_creator && urls.api.create) {
        return <a href={urls.api.create}>
          <AddButton
            variant="secondary"
            text={"Add New " + pageName}
          />
        </a>
      }
    }
    /** Button for batch edit **/
    const batchEditButton = () => {
      if (user.is_creator && urls.api.batch) {
        const selectedIds = selectedModelData.filter(row => !row.permission || row.permission.edit).map(row => row.id)
        return <a
          href={urls.api.batch + '?ids=' + selectedIds.join(',')}>
          <ThemeButton
            variant="secondary Basic"
            disabled={!selectedIds.length}>
            <EditIcon/>Batch
            edit {(selectedIds.length ? `(${selectedIds.length} Selected)` : "")}
          </ThemeButton>
        </a>
      }
    }
    return (
      <Admin
        className='Indicator'
        pageName={pageName}
        rightHeader={
          <Fragment>
            {rightHeader ? rightHeader : null}
            {batchEditButton()}
            {deleteButton()}
            {createButton()}
          </Fragment>
        }
      >
        <List
          columns={columns} pageName={pageName} listUrl={listUrl}
          initData={initData}
          setInitData={newData => {
            if (newData) {
              setData(newData)
            }
          }}
          selectionChanged={
            selectionChanged || multipleDelete ? setSelectionModel : null
          }
          sortingDefault={sortingDefault}
          searchDefault={searchDefault}
          selectable={selectableFunction}
          ref={listRef}
          {...props}
        />
      </Admin>
    );
  }
)