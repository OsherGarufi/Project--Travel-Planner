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

const TOUCH_SCROLL_THRESHOLD_PX = 8

const TOUCH_LONG_PRESS_MS = 400

const DOUBLE_TAP_DELAY_MS = 320

const DOUBLE_TAP_DISTANCE_PX = 28

const MINUTES_PER_DAY =
  24 * 60

const CLICK_SUPPRESSION_MS =
  350

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, .itinerary-week__item-actions, .itinerary-week__delete-confirmation'

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

function createDragSession(
  item,
  clientX,
  clientY,
  cardElement,
) {
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
    return null
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
    cardElement
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
          clientY -
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

  return {
    item,

    itemId:
      item.id,

    cardElement,

    pointerStartX:
      clientX,

    pointerStartY:
      clientY,

    durationMinutes,
    grabOffsetY,

    isDragging:
      false,

    inputType: null,

    longPressTimer:
      null,

    touchIdentifier:
      null,

    onDoubleTap:
      null,

    handlePointerMove:
      null,

    handlePointerUp:
      null,

    handlePointerCancel:
      null,

    handleTouchMove:
      null,

    handleTouchEnd:
      null,

    handleTouchCancel:
      null,
  }
}

function getTouchByIdentifier(
  touchList,
  identifier,
) {
  return Array.from(
    touchList,
  ).find(
    (touch) =>
      touch.identifier ===
      identifier,
  ) ?? null
}

function removeSessionListeners(
  session,
) {
  if (
    session.longPressTimer !==
    null
  ) {
    window.clearTimeout(
      session.longPressTimer,
    )

    session.longPressTimer =
      null
  }

  if (
    session.inputType ===
    'touch'
  ) {
    document.removeEventListener(
      'touchmove',
      session.handleTouchMove,
    )

    document.removeEventListener(
      'touchend',
      session.handleTouchEnd,
    )

    document.removeEventListener(
      'touchcancel',
      session.handleTouchCancel,
    )

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

  const lastTouchTapRef =
    useRef(null)

  useEffect(
    () => () => {
      const session =
        dragSessionRef.current

      if (!session) {
        return
      }

      removeSessionListeners(
        session,
      )
    },
    [],
  )

  const activateDrag =
    (session) => {
      if (
        dragSessionRef.current !==
          session ||
        session.isDragging
      ) {
        return
      }

      session.isDragging =
        true

      suppressClickUntilRef.current =
        Date.now() +
        CLICK_SUPPRESSION_MS

      setDraggingItemId(
        session.itemId,
      )

      onDragStart?.(
        session.itemId,
      )
    }

  const updateDragPreview =
    (
      session,
      clientX,
      clientY,
    ) => {
      const unscheduledElement =
        unscheduledDropRef?.current

      const unscheduledRect =
        unscheduledElement
          ?.getBoundingClientRect()

      if (
        isPointInsideRect(
          clientX,
          clientY,
          unscheduledRect,
        )
      ) {
        const nextPreview =
          createUnscheduledPreview(
            session.itemId,
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
        clientX >=
          calendarRect.left &&
        clientX <=
          calendarRect.right

      if (!isInsideCalendarX) {
        return
      }

      const targetColumn =
        getClosestDayColumn(
          calendarElement,
          clientX,
        )

      if (!targetColumn) {
        return
      }

      const targetRect =
        targetColumn
          .getBoundingClientRect()

      const isInsideTimelineY =
        clientY >=
          targetRect.top &&
        clientY <=
          targetRect.bottom

      if (!isInsideTimelineY) {
        return
      }

      const nextPreview =
        createCalendarPreview(
          session,
          targetColumn,
          clientY,
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

  const finishDrag =
    (
      session,
      shouldCommit,
    ) => {
      if (
        dragSessionRef.current !==
        session
      ) {
        return
      }

      const preview =
        dragPreviewRef.current

      const didDrag =
        session.isDragging

      if (didDrag) {
        suppressClickUntilRef.current =
          Date.now() +
          CLICK_SUPPRESSION_MS
      }

      removeSessionListeners(
        session,
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
          session.item.startTime,
        )

      const originalEndMinutes =
        parseTimeToMinutes(
          session.item.endTime,
        )

      let didScheduleChange

      if (
        preview.targetType ===
        'unscheduled'
      ) {
        didScheduleChange =
          Boolean(
            session.item
              .itineraryDate,
          ) ||
          originalStartMinutes !==
            null ||
          originalEndMinutes !==
            null
      } else {
        didScheduleChange =
          preview.itineraryDate !==
            session.item
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
        session.item,
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

  const registerTouchTap =
    (
      session,
      touch,
      event,
    ) => {
      const now =
        Date.now()

      const previousTap =
        lastTouchTapRef.current

      const isSameItem =
        previousTap?.itemId ===
        session.itemId

      const isWithinDelay =
        previousTap &&
        now -
          previousTap.time <=
          DOUBLE_TAP_DELAY_MS

      const isNearPreviousTap =
        previousTap &&
        Math.hypot(
          touch.clientX -
            previousTap.clientX,
          touch.clientY -
            previousTap.clientY,
        ) <=
          DOUBLE_TAP_DISTANCE_PX

      if (
        isSameItem &&
        isWithinDelay &&
        isNearPreviousTap
      ) {
        event.preventDefault()

        lastTouchTapRef.current =
          null

        suppressClickUntilRef.current =
          now +
          CLICK_SUPPRESSION_MS

        session.onDoubleTap?.({
          currentTarget:
            session.cardElement,

          clientX:
            touch.clientX,

          clientY:
            touch.clientY,
        })

        return
      }

      lastTouchTapRef.current = {
        itemId:
          session.itemId,

        time:
          now,

        clientX:
          touch.clientX,

        clientY:
          touch.clientY,
      }
    }

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
      'touch'
    ) {
      return
    }

    if (
      event.pointerType ===
        'mouse' &&
      event.button !== 0
    ) {
      return
    }

    if (
      event.target.closest(
        INTERACTIVE_SELECTOR,
      )
    ) {
      return
    }

    const session =
      createDragSession(
        item,
        event.clientX,
        event.clientY,
        event.currentTarget,
      )

    if (!session) {
      return
    }

    session.inputType =
      'pointer'

    session.handlePointerMove =
      (moveEvent) => {
        const currentSession =
          dragSessionRef.current

        if (
          currentSession !==
          session
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

          activateDrag(
            currentSession,
          )
        }

        moveEvent.preventDefault()

        updateDragPreview(
          currentSession,
          moveEvent.clientX,
          moveEvent.clientY,
        )
      }

    session.handlePointerUp =
      () =>
        finishDrag(
          session,
          true,
        )

    session.handlePointerCancel =
      () =>
        finishDrag(
          session,
          false,
        )

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

  const startTouchDrag = (
    event,
    item,
    onDoubleTap,
  ) => {
    if (
      !item?.id ||
      dragSessionRef.current ||
      event.touches.length !== 1
    ) {
      return
    }

    if (
      event.target.closest(
        INTERACTIVE_SELECTOR,
      )
    ) {
      return
    }

    const touch =
      event.touches[0]

    const session =
      createDragSession(
        item,
        touch.clientX,
        touch.clientY,
        event.currentTarget,
      )

    if (!session) {
      return
    }

    session.inputType =
      'touch'

    session.touchIdentifier =
      touch.identifier

    session.onDoubleTap =
      onDoubleTap

    session.handleTouchMove =
      (moveEvent) => {
        const currentSession =
          dragSessionRef.current

        if (
          currentSession !==
          session
        ) {
          return
        }

        if (
          moveEvent.touches.length !==
          1
        ) {
          finishDrag(
            currentSession,
            false,
          )

          return
        }

        const activeTouch =
          getTouchByIdentifier(
            moveEvent.touches,
            currentSession
              .touchIdentifier,
          )

        if (!activeTouch) {
          return
        }

        const deltaX =
          activeTouch.clientX -
          currentSession
            .pointerStartX

        const deltaY =
          activeTouch.clientY -
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
            movementDistance >=
            TOUCH_SCROLL_THRESHOLD_PX
          ) {
            finishDrag(
              currentSession,
              false,
            )
          }

          return
        }

        moveEvent.preventDefault()

        updateDragPreview(
          currentSession,
          activeTouch.clientX,
          activeTouch.clientY,
        )
      }

    session.handleTouchEnd =
      (endEvent) => {
        const currentSession =
          dragSessionRef.current

        if (
          currentSession !==
          session
        ) {
          return
        }

        const endedTouch =
          getTouchByIdentifier(
            endEvent.changedTouches,
            currentSession
              .touchIdentifier,
          )

        if (
          currentSession
            .isDragging
        ) {
          endEvent.preventDefault()

          if (endedTouch) {
            updateDragPreview(
              currentSession,
              endedTouch.clientX,
              endedTouch.clientY,
            )
          }

          finishDrag(
            currentSession,
            true,
          )

          return
        }

        if (endedTouch) {
          registerTouchTap(
            currentSession,
            endedTouch,
            endEvent,
          )
        }

        finishDrag(
          currentSession,
          false,
        )
      }

    session.handleTouchCancel =
      () =>
        finishDrag(
          session,
          false,
        )

    dragSessionRef.current =
      session

    session.longPressTimer =
      window.setTimeout(
        () => {
          activateDrag(
            session,
          )
        },
        TOUCH_LONG_PRESS_MS,
      )

    document.addEventListener(
      'touchmove',
      session.handleTouchMove,
      {
        passive: false,
      },
    )

    document.addEventListener(
      'touchend',
      session.handleTouchEnd,
      {
        passive: false,
      },
    )

    document.addEventListener(
      'touchcancel',
      session.handleTouchCancel,
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
    startTouchDrag,
    shouldSuppressClick,
  }
}