import {
    useEffect,
    useRef,
    useState,
} from 'react'
import {
    ITINERARY_DEFAULT_DURATION_MINUTES,
    ITINERARY_HOUR_HEIGHT,
    ITINERARY_SNAP_MINUTES,
} from '../../services/itinerary/itineraryConstants'
import {
    minutesToTimeValue,
    parseTimeToMinutes,
    snapMinutesToInterval,
} from '../../services/itinerary/itineraryDateTimeUtils'

const DRAG_THRESHOLD_PX = 6

const MINUTES_PER_DAY =
  24 * 60

const CLICK_SUPPRESSION_MS =
  350

function clamp(
  value,
  minimum,
  maximum,
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  )
}

function isPointInsideRect(
  clientX,
  clientY,
  rect,
) {
  if (!rect) {
    return false
  }

  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  )
}

function getClosestDayColumn(
  rootElement,
  clientX,
) {
  if (!rootElement) {
    return null
  }

  const columns =
    Array.from(
      rootElement.querySelectorAll(
        '[data-itinerary-date]',
      ),
    )

  if (
    columns.length === 0
  ) {
    return null
  }

  const columnWithPointer =
    columns.find(
      (column) => {
        const rect =
          column.getBoundingClientRect()

        return (
          clientX >= rect.left &&
          clientX <= rect.right
        )
      },
    )

  if (columnWithPointer) {
    return columnWithPointer
  }

  return columns.reduce(
    (
      closestColumn,
      column,
    ) => {
      if (!closestColumn) {
        return column
      }

      const columnRect =
        column.getBoundingClientRect()

      const closestRect =
        closestColumn
          .getBoundingClientRect()

      const columnCenter =
        (
          columnRect.left +
          columnRect.right
        ) / 2

      const closestCenter =
        (
          closestRect.left +
          closestRect.right
        ) / 2

      return Math.abs(
        clientX -
          columnCenter,
      ) <
        Math.abs(
          clientX -
            closestCenter,
        )
        ? column
        : closestColumn
    },
    null,
  )
}

function getMaximumStartMinutes(
  durationMinutes,
) {
  const latestPossibleStart =
    Math.max(
      0,
      MINUTES_PER_DAY -
        durationMinutes,
    )

  return (
    Math.floor(
      latestPossibleStart /
        ITINERARY_SNAP_MINUTES,
    ) *
    ITINERARY_SNAP_MINUTES
  )
}

function hasPreviewChanged(
  previousPreview,
  nextPreview,
) {
  return !(
    previousPreview?.itemId ===
      nextPreview.itemId &&
    previousPreview
      ?.targetType ===
      nextPreview.targetType &&
    previousPreview
      ?.itineraryDate ===
      nextPreview.itineraryDate &&
    previousPreview
      ?.startMinutes ===
      nextPreview.startMinutes &&
    previousPreview
      ?.endMinutes ===
      nextPreview.endMinutes
  )
}

function createUnscheduledPreview(
  itemId,
) {
  return {
    itemId,

    targetType:
      'unscheduled',

    itineraryDate: null,

    startMinutes: null,
    endMinutes: null,

    startTime: null,
    endTime: null,
  }
}

function createCalendarPreview(
  session,
  targetColumn,
  clientY,
) {
  const targetDate =
    targetColumn.dataset
      .itineraryDate

  if (!targetDate) {
    return null
  }

  const targetRect =
    targetColumn
      .getBoundingClientRect()

  const rawTop =
    clientY -
    targetRect.top -
    session.grabOffsetY

  const rawStartMinutes =
    (
      rawTop /
      ITINERARY_HOUR_HEIGHT
    ) * 60

  const snappedStartMinutes =
    snapMinutesToInterval(
      rawStartMinutes,
    )

  const maximumStartMinutes =
    getMaximumStartMinutes(
      session.durationMinutes,
    )

  const startMinutes =
    clamp(
      snappedStartMinutes,
      0,
      maximumStartMinutes,
    )

  const endMinutes =
    startMinutes +
    session.durationMinutes

  return {
    itemId:
      session.itemId,

    targetType:
      'calendar',

    itineraryDate:
      targetDate,

    startMinutes,
    endMinutes,

    startTime:
      minutesToTimeValue(
        startMinutes,
      ),

    endTime:
      minutesToTimeValue(
        endMinutes,
      ),
  }
}

export function useItineraryDrag({
  calendarScrollRef,
  unscheduledDropRef,
  onDragStart,
  onDrop,
}) {
  const [
    dragPreview,
    setDragPreview,
  ] = useState(null)

  const [
    draggingItemId,
    setDraggingItemId,
  ] = useState(null)

  const dragSessionRef =
    useRef(null)

  const dragPreviewRef =
    useRef(null)

  const suppressClickUntilRef =
    useRef(0)

  useEffect(
    () => () => {
      const session =
        dragSessionRef.current

      if (!session) {
        return
      }

      document.removeEventListener(
        'pointermove',
        session.handlePointerMove,
      )

      document.removeEventListener(
        'pointerup',
        session.handlePointerUp,
      )

      document.removeEventListener(
        'pointercancel',
        session.handlePointerCancel,
      )
    },
    [],
  )

  const startDrag = (
    event,
    item,
  ) => {
    if (
      !item?.id ||
      dragSessionRef.current
    ) {
      return
    }

    if (
      event.pointerType ===
        'touch' ||
      (
        event.pointerType ===
          'mouse' &&
        event.button !== 0
      )
    ) {
      return
    }

    if (
      event.target.closest(
        'button, a, input, textarea, select, .itinerary-week__item-actions, .itinerary-week__delete-confirmation',
      )
    ) {
      return
    }

    const parsedStartMinutes =
      parseTimeToMinutes(
        item.startTime,
      )

    const parsedEndMinutes =
      parseTimeToMinutes(
        item.endTime,
      )

    const isScheduled =
      Boolean(
        item.itineraryDate,
      ) &&
      parsedStartMinutes !==
        null &&
      parsedEndMinutes !==
        null &&
      parsedEndMinutes >
        parsedStartMinutes

    const isUnscheduled =
      !item.itineraryDate &&
      !item.startTime &&
      !item.endTime

    if (
      !isScheduled &&
      !isUnscheduled
    ) {
      return
    }

    const durationMinutes =
      isScheduled
        ? parsedEndMinutes -
          parsedStartMinutes
        : ITINERARY_DEFAULT_DURATION_MINUTES

    const logicalHeight =
      (
        durationMinutes /
        60
      ) *
      ITINERARY_HOUR_HEIGHT

    const cardRect =
      event.currentTarget
        .getBoundingClientRect()

    let grabOffsetY =
      logicalHeight / 2

    if (
      isScheduled &&
      cardRect.height > 0
    ) {
      const pointerRatio =
        clamp(
          (
            event.clientY -
            cardRect.top
          ) /
            cardRect.height,
          0,
          1,
        )

      grabOffsetY =
        pointerRatio *
        logicalHeight
    }

    const session = {
      item,
      itemId:
        item.id,

      pointerStartX:
        event.clientX,

      pointerStartY:
        event.clientY,

      durationMinutes,
      grabOffsetY,

      isDragging:
        false,

      handlePointerMove:
        null,

      handlePointerUp:
        null,

      handlePointerCancel:
        null,
    }

    const handlePointerMove =
      (moveEvent) => {
        const currentSession =
          dragSessionRef.current

        if (
          !currentSession ||
          currentSession.itemId !==
            session.itemId
        ) {
          return
        }

        const deltaX =
          moveEvent.clientX -
          currentSession
            .pointerStartX

        const deltaY =
          moveEvent.clientY -
          currentSession
            .pointerStartY

        const movementDistance =
          Math.hypot(
            deltaX,
            deltaY,
          )

        if (
          !currentSession
            .isDragging
        ) {
          if (
            movementDistance <
            DRAG_THRESHOLD_PX
          ) {
            return
          }

          currentSession
            .isDragging = true

          suppressClickUntilRef.current =
            Date.now() +
            CLICK_SUPPRESSION_MS

          setDraggingItemId(
            currentSession.itemId,
          )

          onDragStart?.(
            currentSession.itemId,
          )
        }

        moveEvent.preventDefault()

        const unscheduledElement =
          unscheduledDropRef?.current

        const unscheduledRect =
          unscheduledElement
            ?.getBoundingClientRect()

        if (
          isPointInsideRect(
            moveEvent.clientX,
            moveEvent.clientY,
            unscheduledRect,
          )
        ) {
          const nextPreview =
            createUnscheduledPreview(
              currentSession.itemId,
            )

          if (
            !hasPreviewChanged(
              dragPreviewRef.current,
              nextPreview,
            )
          ) {
            return
          }

          dragPreviewRef.current =
            nextPreview

          setDragPreview(
            nextPreview,
          )

          return
        }

        const calendarElement =
          calendarScrollRef.current

        if (!calendarElement) {
          return
        }

        const calendarRect =
          calendarElement
            .getBoundingClientRect()

        const isInsideCalendarX =
          moveEvent.clientX >=
            calendarRect.left &&
          moveEvent.clientX <=
            calendarRect.right

        if (!isInsideCalendarX) {
          return
        }

        const targetColumn =
          getClosestDayColumn(
            calendarElement,
            moveEvent.clientX,
          )

        if (!targetColumn) {
          return
        }

        const targetRect =
          targetColumn
            .getBoundingClientRect()

        const isInsideTimelineY =
          moveEvent.clientY >=
            targetRect.top &&
          moveEvent.clientY <=
            targetRect.bottom

        if (!isInsideTimelineY) {
          return
        }

        const nextPreview =
          createCalendarPreview(
            currentSession,
            targetColumn,
            moveEvent.clientY,
          )

        if (!nextPreview) {
          return
        }

        if (
          !hasPreviewChanged(
            dragPreviewRef.current,
            nextPreview,
          )
        ) {
          return
        }

        dragPreviewRef.current =
          nextPreview

        setDragPreview(
          nextPreview,
        )
      }

    const finishDrag = (
      shouldCommit,
    ) => {
      const currentSession =
        dragSessionRef.current

      if (!currentSession) {
        return
      }

      const preview =
        dragPreviewRef.current

      const didDrag =
        currentSession.isDragging

      if (didDrag) {
        suppressClickUntilRef.current =
          Date.now() +
          CLICK_SUPPRESSION_MS
      }

      document.removeEventListener(
        'pointermove',
        currentSession
          .handlePointerMove,
      )

      document.removeEventListener(
        'pointerup',
        currentSession
          .handlePointerUp,
      )

      document.removeEventListener(
        'pointercancel',
        currentSession
          .handlePointerCancel,
      )

      dragSessionRef.current =
        null

      dragPreviewRef.current =
        null

      setDragPreview(null)

      setDraggingItemId(null)

      if (
        !shouldCommit ||
        !didDrag ||
        !preview
      ) {
        return
      }

      const originalStartMinutes =
        parseTimeToMinutes(
          currentSession
            .item.startTime,
        )

      const originalEndMinutes =
        parseTimeToMinutes(
          currentSession
            .item.endTime,
        )

      let didScheduleChange =
        false

      if (
        preview.targetType ===
        'unscheduled'
      ) {
        didScheduleChange =
          Boolean(
            currentSession
              .item
              .itineraryDate,
          ) ||
          originalStartMinutes !==
            null ||
          originalEndMinutes !==
            null
      } else {
        didScheduleChange =
          preview.itineraryDate !==
            currentSession.item
              .itineraryDate ||
          preview.startMinutes !==
            originalStartMinutes ||
          preview.endMinutes !==
            originalEndMinutes
      }

      if (!didScheduleChange) {
        return
      }

      onDrop?.(
        currentSession.item,
        {
          itineraryDate:
            preview.itineraryDate,

          startTime:
            preview.startTime,

          endTime:
            preview.endTime,
        },
      )
    }

    session.handlePointerMove =
      handlePointerMove

    session.handlePointerUp =
      () =>
        finishDrag(true)

    session.handlePointerCancel =
      () =>
        finishDrag(false)

    dragSessionRef.current =
      session

    document.addEventListener(
      'pointermove',
      session.handlePointerMove,
      {
        passive: false,
      },
    )

    document.addEventListener(
      'pointerup',
      session.handlePointerUp,
    )

    document.addEventListener(
      'pointercancel',
      session.handlePointerCancel,
    )
  }

  const shouldSuppressClick =
    () =>
      Date.now() <
      suppressClickUntilRef.current

  return {
    dragPreview,
    draggingItemId,

    startDrag,
    shouldSuppressClick,
  }
}